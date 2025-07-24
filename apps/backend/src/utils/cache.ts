import { createClient, RedisClientType } from 'redis';
import { config } from '../core/config';
import { Logger } from './logger';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        return;
      }

      this.client = createClient({
        url: config.redis.url,
      });

      this.client.on('error', (err) => {
        // Silenciar erros de conexão Redis em desenvolvimento
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        Logger.info('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        Logger.warn('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      Logger.warn('Redis not available, running without cache');
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      Logger.info('Redis Client Disconnected');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      Logger.debug('Cache miss: Redis not connected', { key });
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value === null) {
        Logger.debug('Cache miss', { key });
        return null;
      }

      const parsed = JSON.parse(String(value)) as T;
      Logger.debug('Cache hit', { key });
      return parsed;
    } catch (error) {
      Logger.error('Cache get error', error as Error, { key });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      Logger.debug('Cache set failed: Redis not connected', { key });
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
      Logger.debug('Cache set', { key, ttl: ttlSeconds });
      return true;
    } catch (error) {
      Logger.error('Cache set error', error as Error, { key });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.del(key);
      Logger.debug('Cache delete', { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      Logger.error('Cache delete error', error as Error, { key });
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(keys);
      Logger.debug('Cache pattern delete', { pattern, deletedCount: result });
      return result;
    } catch (error) {
      Logger.error('Cache pattern delete error', error as Error, { pattern });
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      Logger.error('Cache exists error', error as Error, { key });
      return false;
    }
  }

  // Cache keys helper functions
  static keys = {
    user: (id: string) => `user:${id}`,
    userProfile: (id: string) => `user:profile:${id}`,
    post: (id: string) => `post:${id}`,
    posts: (page: number, limit: number, filters?: string) => 
      `posts:${page}:${limit}${filters ? `:${filters}` : ''}`,
    userPosts: (userId: string, page: number, limit: number) => 
      `user:${userId}:posts:${page}:${limit}`,
    publicStats: () => 'stats:public',
  };

  // Cache TTL constants (in seconds)
  static ttl = {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes  
    LONG: 900, // 15 minutes
    HOUR: 3600, // 1 hour
    DAY: 86400, // 24 hours
  };
}

export const cache = new CacheService();
export { CacheService };