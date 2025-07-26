import { createClient, RedisClientType } from 'redis';
// import { logger } from '../utils/logger/winston/logger';

// Configurações do Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configurações por ambiente
const getRedisConfig = () => {
  const baseConfig = {
    url: REDIS_URL,
    // Configurações de conexão
    socket: {
      connectTimeout: 60000,
      lazyConnect: true,
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          return new Error('Redis connection failed after 10 retries');
        }
        return Math.min(retries * 50, 500);
      },
    },
    // Configurações específicas por ambiente
    ...(NODE_ENV === 'production' && {
      database: 0,
      name: 'socialbiblia-redis',
      // Pool de conexões para produção
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
    }),
  };

  return baseConfig;
};

// Classe gerenciadora do Redis
class RedisManager {
  private static instance: RedisClientType;
  private static isConnected = false;
  private static retryCount = 0;
  private static maxRetries = 5;

  static getInstance(): RedisClientType {
    if (!RedisManager.instance) {
      RedisManager.instance = createClient(getRedisConfig()) as RedisClientType;
      
      // Event listeners
      RedisManager.instance.on('connect', () => {
        console.log('Redis connection established', {
          url: REDIS_URL.replace(/\/\/.*@/, '//***@'), // Mask credentials
          environment: NODE_ENV,
        });
        RedisManager.isConnected = true;
        RedisManager.retryCount = 0;
      });

      RedisManager.instance.on('ready', () => {
        console.log('Redis client ready');
      });

      RedisManager.instance.on('error', (error) => {
        console.error('Redis connection error', {
          error: error.message,
          retryCount: RedisManager.retryCount,
        });
        RedisManager.isConnected = false;
      });

      RedisManager.instance.on('end', () => {
        console.log('Redis connection ended');
        RedisManager.isConnected = false;
      });

      RedisManager.instance.on('reconnecting', () => {
        RedisManager.retryCount++;
        console.log(`Redis reconnecting (attempt ${RedisManager.retryCount})...`);
      });
    }

    return RedisManager.instance;
  }

  static async connect(): Promise<void> {
    if (RedisManager.isConnected) {
      return;
    }

    try {
      const client = RedisManager.getInstance();
      await client.connect();
      
      // Testar conexão
      const pong = await client.ping();
      if (pong !== 'PONG') {
        throw new Error('Redis ping test failed');
      }

      console.log('Redis connection verified', {
        status: 'connected',
        environment: NODE_ENV,
      });

    } catch (error) {
      RedisManager.isConnected = false;
      
      console.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
        redisUrl: REDIS_URL ? 'configured' : 'missing',
        retryCount: RedisManager.retryCount,
      });

      // Se não conseguir conectar e for ambiente de desenvolvimento, continuar sem Redis
      if (NODE_ENV === 'development') {
        console.warn('Redis unavailable in development - continuing without cache');
        return;
      }

      throw new Error('Redis connection failed');
    }
  }

  static async disconnect(): Promise<void> {
    if (RedisManager.instance && RedisManager.isConnected) {
      await RedisManager.instance.quit();
      RedisManager.isConnected = false;
      
      console.log('Redis disconnected');
    }
  }

  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      responseTime: number;
      memory?: string;
      error?: string;
    };
  }> {
    try {
      const start = Date.now();
      const client = RedisManager.getInstance();
      
      if (!RedisManager.isConnected) {
        return {
          status: 'unhealthy',
          details: {
            connected: false,
            responseTime: -1,
            error: 'Not connected',
          },
        };
      }

      // Testar ping
      await client.ping();
      const responseTime = Date.now() - start;

      // Obter informações de memória
      const info = await client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)\r/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        status: 'healthy',
        details: {
          connected: RedisManager.isConnected,
          responseTime,
          memory,
        },
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          responseTime: -1,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  static isHealthy(): boolean {
    return RedisManager.isConnected;
  }
}

// Cache utility class
export class CacheService {
  private redis: RedisClientType;
  private defaultTTL: number = 3600; // 1 hora

  constructor() {
    this.redis = RedisManager.getInstance();
  }

  // Métodos básicos de cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to get from cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setEx(key, ttl, serialized);
      
      console.log(`Cache set: ${key}`, { ttl, size: serialized.length });
      return true;
    } catch (error) {
      console.error('Failed to set cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Failed to delete from cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Failed to check cache existence', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async flush(): Promise<boolean> {
    try {
      await this.redis.flushDb();
      console.log('Cache flushed');
      return true;
    } catch (error) {
      console.error('Failed to flush cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Métodos avançados
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Failed to get multiple keys', {
        keys: keys.slice(0, 5), // Log apenas as primeiras 5 chaves
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const pipeline = this.redis.multi();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        pipeline.setEx(key, ttl, serialized);
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Failed to set multiple keys', {
        keyCount: Object.keys(keyValuePairs).length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Cache com pattern de keys
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      console.error('Failed to get keys by pattern', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  async delByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;

      const result = await this.redis.del(keys);
      console.log(`Deleted ${result} keys matching pattern: ${pattern}`);
      return result;
    } catch (error) {
      console.error('Failed to delete by pattern', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Métodos específicos da aplicação
  async cacheUser(userId: string, userData: any, ttl: number = 1800): Promise<boolean> {
    return await this.set(`user:${userId}`, userData, ttl);
  }

  async getCachedUser<T>(userId: string): Promise<T | null> {
    return await this.get<T>(`user:${userId}`);
  }

  async invalidateUserCache(userId: string): Promise<boolean> {
    return await this.del(`user:${userId}`);
  }

  async cacheQuery(queryKey: string, result: any, ttl: number = 300): Promise<boolean> {
    return await this.set(`query:${queryKey}`, result, ttl);
  }

  async getCachedQuery<T>(queryKey: string): Promise<T | null> {
    return await this.get<T>(`query:${queryKey}`);
  }

  async invalidateQueryCache(pattern: string = 'query:*'): Promise<number> {
    return await this.delByPattern(pattern);
  }

  // Session cache
  async setSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
    return await this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return await this.get<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return await this.del(`session:${sessionId}`);
  }
}

// Export da instância singleton
export const redis = RedisManager.getInstance();
export { RedisManager };

// Export do cache service
export const cache = new CacheService();

// Export de utility functions
export const redisUtils = {
  connect: RedisManager.connect,
  disconnect: RedisManager.disconnect,
  healthCheck: RedisManager.healthCheck,
  isHealthy: RedisManager.isHealthy,
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Redis connection...');
  await RedisManager.disconnect();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Redis connection...');
  await RedisManager.disconnect();
});

// Auto-connect em desenvolvimento (opcional)
if (NODE_ENV === 'development') {
  RedisManager.connect().catch((error) => {
    console.warn('Failed to auto-connect to Redis in development', {
      error: error.message,
    });
  });
}