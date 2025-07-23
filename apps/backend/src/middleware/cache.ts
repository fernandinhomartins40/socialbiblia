import { Request, Response, NextFunction } from 'express';
import { cache, CacheService } from '../utils/cache';
import { Logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = CacheService.ttl.MEDIUM,
    keyGenerator = (req: Request) => `cache:${req.method}:${req.originalUrl}`,
    condition = () => true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Apenas cache GET requests por padrão
    if (req.method !== 'GET' || !condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const context = {
      requestId: req.headers['x-request-id'] as string,
      method: req.method,
      url: req.originalUrl,
      cacheKey,
    };

    try {
      // Tentar obter do cache
      const cachedResponse = await cache.get<{
        data: unknown;
        statusCode: number;
        headers: Record<string, string>;
      }>(cacheKey);

      if (cachedResponse) {
        Logger.debug('Cache hit - serving from cache', context);
        
        // Definir headers do cache
        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        // Adicionar header indicando que veio do cache
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return res.status(cachedResponse.statusCode).json(cachedResponse.data);
      }

      Logger.debug('Cache miss - executing request', context);

      // Interceptar a resposta para cachear
      const originalJson = res.json.bind(res);
      let responseBody: unknown;
      let statusCode: number;

      res.json = function(body: unknown) {
        responseBody = body;
        statusCode = res.statusCode;
        return originalJson(body);
      };

      // Interceptar o final da resposta
      res.on('finish', async () => {
        // Apenas cachear respostas de sucesso
        if (statusCode >= 200 && statusCode < 300 && responseBody) {
          const responseToCache = {
            data: responseBody,
            statusCode,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'MISS',
              'X-Cache-Key': cacheKey,
            },
          };

          const cached = await cache.set(cacheKey, responseToCache, ttl);
          
          if (cached) {
            Logger.debug('Response cached successfully', {
              ...context,
              statusCode,
              ttl,
            });
          }
        }
      });

      // Adicionar headers indicando que não veio do cache
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      next();
    } catch (error) {
      Logger.error('Cache middleware error', error as Error, context);
      next();
    }
  };
}

// Middleware específicos para diferentes tipos de cache
export const cachePublicData = cacheMiddleware({
  ttl: CacheService.ttl.LONG,
  keyGenerator: (req) => `public:${req.originalUrl}`,
});

export const cacheUserData = cacheMiddleware({
  ttl: CacheService.ttl.MEDIUM,
  keyGenerator: (req) => {
    const userId = (req as any).user?.userId || 'anonymous';
    return `user:${userId}:${req.originalUrl}`;
  },
});

export const cacheShortTerm = cacheMiddleware({
  ttl: CacheService.ttl.SHORT,
});

// Função para invalidar cache
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const deleted = await cache.delPattern(pattern);
    Logger.info('Cache invalidated', { pattern, deletedKeys: deleted });
    return deleted;
  } catch (error) {
    Logger.error('Cache invalidation error', error as Error, { pattern });
    return 0;
  }
}

// Middleware para invalidar cache após operações de escrita
export function invalidateCacheAfter(patterns: string | string[]) {
  const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
  
  return (_req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      // Apenas invalidar após operações de sucesso
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patternsArray) {
          await invalidateCache(pattern);
        }
      }
    });
    
    next();
  };
}