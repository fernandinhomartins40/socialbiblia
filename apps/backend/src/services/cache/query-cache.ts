import { cache } from '../../config/redis';
import { logger } from '../../utils/logger/winston/logger';
import crypto from 'crypto';

// Interface para configuração de cache
interface CacheConfig {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  prefix?: string;
}

// Interface para estatísticas de cache
interface CacheStats {
  hits: number;
  misses: number;
  ratio: number;
  totalQueries: number;
}

export class QueryCacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    ratio: 0,
    totalQueries: 0,
  };

  private defaultTTL = 300; // 5 minutos
  private readonly prefix = 'query_cache';

  // Gerar chave de cache baseada na query e parâmetros
  private generateCacheKey(query: string, params: any = {}, prefix?: string): string {
    const queryHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ query, params }))
      .digest('hex')
      .substring(0, 16);

    const keyPrefix = prefix || this.prefix;
    return `${keyPrefix}:${queryHash}`;
  }

  // Cache wrapper para queries do Prisma
  async cacheQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    config: CacheConfig = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, tags = [], prefix } = config;
    const key = this.generateCacheKey(cacheKey, {}, prefix);

    try {
      // Tentar obter do cache primeiro
      const cached = await cache.get<T>(key);
      
      if (cached !== null) {
        this.stats.hits++;
        this.updateStats();
        
        logger.debug(`Cache HIT: ${key}`, {
          cacheKey,
          tags,
          stats: this.getStats(),
        });
        
        return cached;
      }

      // Cache miss - executar query
      this.stats.misses++;
      
      logger.debug(`Cache MISS: ${key}`, {
        cacheKey,
        tags,
      });

      const result = await queryFn();
      
      // Armazenar no cache
      const success = await cache.set(key, result, ttl);
      
      if (success) {
        // Adicionar tags para invalidação
        if (tags.length > 0) {
          await this.addTags(key, tags);
        }
        
        logger.debug(`Cache SET: ${key}`, {
          cacheKey,
          tags,
          ttl,
          dataSize: JSON.stringify(result).length,
        });
      }

      this.updateStats();
      return result;

    } catch (error) {
      logger.logError('query_cache_error', 'Error in query cache', {
        cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Em caso de erro de cache, executar query diretamente
      return await queryFn();
    }
  }

  // Cache específico para queries de usuários
  async cacheUserQuery<T>(
    userId: string,
    queryFn: () => Promise<T>,
    queryType: string,
    ttl: number = 600 // 10 minutos
  ): Promise<T> {
    const cacheKey = `user:${userId}:${queryType}`;
    
    return this.cacheQuery(queryFn, cacheKey, {
      ttl,
      tags: [`user:${userId}`, `query_type:${queryType}`],
      prefix: 'user_query',
    });
  }

  // Cache específico para queries de posts
  async cachePostQuery<T>(
    postId: string,
    queryFn: () => Promise<T>,
    queryType: string,
    ttl: number = 300
  ): Promise<T> {
    const cacheKey = `post:${postId}:${queryType}`;
    
    return this.cacheQuery(queryFn, cacheKey, {
      ttl,
      tags: [`post:${postId}`, `query_type:${queryType}`],
      prefix: 'post_query',
    });
  }

  // Cache para feed de posts
  async cacheFeedQuery<T>(
    userId: string,
    page: number,
    limit: number,
    filters: any,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `feed:${userId}:p${page}:l${limit}:${crypto
      .createHash('md5')
      .update(JSON.stringify(filters))
      .digest('hex')
      .substring(0, 8)}`;
    
    return this.cacheQuery(queryFn, cacheKey, {
      ttl: 180, // 3 minutos para feeds
      tags: [`user:${userId}`, 'feed', `page:${page}`],
      prefix: 'feed_query',
    });
  }

  // Cache para queries de busca
  async cacheSearchQuery<T>(
    searchTerm: string,
    filters: any,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `search:${searchTerm}:${crypto
      .createHash('md5')
      .update(JSON.stringify(filters))
      .digest('hex')
      .substring(0, 8)}`;
    
    return this.cacheQuery(queryFn, cacheKey, {
      ttl: 900, // 15 minutos para buscas
      tags: ['search', `term:${searchTerm.toLowerCase()}`],
      prefix: 'search_query',
    });
  }

  // Adicionar tags para uma chave de cache
  private async addTags(cacheKey: string, tags: string[]): Promise<void> {
    try {
      const tagPromises = tags.map(tag => 
        cache.set(`tag:${tag}:${cacheKey}`, true, 86400) // 24 horas
      );
      
      await Promise.all(tagPromises);
    } catch (error) {
      logger.logError('cache_tag_error', 'Failed to add cache tags', {
        cacheKey,
        tags,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Invalidar cache por tags
  async invalidateByTag(...tags: string[]): Promise<number> {
    let totalInvalidated = 0;

    try {
      for (const tag of tags) {
        const tagKeys = await cache.keys(`tag:${tag}:*`);
        
        if (tagKeys.length > 0) {
          // Extrair as chaves de cache das chaves de tag
          const cacheKeys = tagKeys.map(tagKey => {
            const parts = tagKey.split(':');
            return parts.slice(2).join(':'); // Remover 'tag:tagname:'
          });

          // Deletar as chaves de cache e as chaves de tag
          const deletePromises = [
            ...cacheKeys.map(key => cache.del(key)),
            ...tagKeys.map(key => cache.del(key))
          ];

          await Promise.all(deletePromises);
          totalInvalidated += cacheKeys.length;

          logger.info(`Invalidated ${cacheKeys.length} cache entries for tag: ${tag}`);
        }
      }

      if (totalInvalidated > 0) {
        logger.logSecurity('cache_invalidation', 'Cache invalidated by tags', {
          tags,
          entriesInvalidated: totalInvalidated,
        });
      }

      return totalInvalidated;

    } catch (error) {
      logger.logError('cache_invalidation_error', 'Failed to invalidate cache by tags', {
        tags,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Invalidar cache de usuário específico
  async invalidateUserCache(userId: string): Promise<number> {
    return this.invalidateByTag(`user:${userId}`);
  }

  // Invalidar cache de post específico
  async invalidatePostCache(postId: string): Promise<number> {
    return this.invalidateByTag(`post:${postId}`);
  }

  // Invalidar todos os feeds
  async invalidateAllFeeds(): Promise<number> {
    return this.invalidateByTag('feed');
  }

  // Invalidar cache de busca
  async invalidateSearchCache(searchTerm?: string): Promise<number> {
    if (searchTerm) {
      return this.invalidateByTag(`term:${searchTerm.toLowerCase()}`);
    }
    return this.invalidateByTag('search');
  }

  // Limpar todo o cache de queries
  async clearAllQueryCache(): Promise<boolean> {
    try {
      const patterns = [
        `${this.prefix}:*`,
        'user_query:*',
        'post_query:*',
        'feed_query:*',
        'search_query:*',
        'tag:*'
      ];

      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cache.delByPattern(pattern);
        totalDeleted += deleted;
      }

      logger.info(`Cleared all query cache - ${totalDeleted} entries deleted`);
      
      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        ratio: 0,
        totalQueries: 0,
      };

      return true;

    } catch (error) {
      logger.logError('cache_clear_error', 'Failed to clear query cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Atualizar estatísticas
  private updateStats(): void {
    this.stats.totalQueries = this.stats.hits + this.stats.misses;
    this.stats.ratio = this.stats.totalQueries > 0 
      ? Number((this.stats.hits / this.stats.totalQueries * 100).toFixed(2))
      : 0;
  }

  // Obter estatísticas de cache
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Reset das estatísticas
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      ratio: 0,
      totalQueries: 0,
    };
  }

  // Warming up - pré-carregar cache comum
  async warmup(): Promise<void> {
    logger.info('Starting cache warmup...');
    
    try {
      // Implementar lógica de warmup aqui
      // Por exemplo, carregar dados mais acessados
      
      logger.info('Cache warmup completed');
    } catch (error) {
      logger.logError('cache_warmup_error', 'Cache warmup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Método para obter informações detalhadas do cache
  async getCacheInfo(): Promise<{
    stats: CacheStats;
    memoryUsage: any;
    keyCount: number;
    topKeys: string[];
  }> {
    try {
      const [memoryInfo, allKeys] = await Promise.all([
        cache.redis.info('memory'),
        cache.keys(`${this.prefix}:*`)
      ]);

      // Pegar as 10 chaves mais recentes como exemplo
      const topKeys = allKeys.slice(0, 10);

      return {
        stats: this.getStats(),
        memoryUsage: this.parseMemoryInfo(memoryInfo),
        keyCount: allKeys.length,
        topKeys,
      };

    } catch (error) {
      logger.logError('cache_info_error', 'Failed to get cache info', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        stats: this.getStats(),
        memoryUsage: {},
        keyCount: 0,
        topKeys: [],
      };
    }
  }

  private parseMemoryInfo(memoryInfo: string): any {
    const info: any = {};
    const lines = memoryInfo.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        info[key] = value;
      }
    }
    
    return info;
  }
}

// Export singleton instance
export const queryCache = new QueryCacheService();