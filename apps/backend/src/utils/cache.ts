import { createClient, RedisClientType } from 'redis';
import { config } from '../core/config';
import { Logger } from './logger';

interface CacheConfig {
  url: string;
  maxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  connectionTimeoutMs: number;
  commandTimeoutMs: number;
  healthCheckIntervalMs: number;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

class CacheService {
  private client: RedisClientType | null = null;
  
  // TTL constants in seconds
  static readonly ttl = {
    SHORT: 300,    // 5 minutes
    MEDIUM: 1800,  // 30 minutes
    LONG: 3600,    // 1 hour
    DAY: 86400,    // 24 hours
  } as const;
  private isConnected = false;
  private connectionAttempts = 0;
  private circuitBreaker: CircuitBreakerState;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly cacheConfig: CacheConfig;

  constructor() {
    this.cacheConfig = {
      url: config.redis.url,
      maxRetries: config.redis.maxRetries,
      retryDelayMs: config.redis.retryDelayMs,
      maxRetryDelayMs: config.redis.maxRetryDelayMs,
      connectionTimeoutMs: config.redis.connectionTimeoutMs,
      commandTimeoutMs: config.redis.commandTimeoutMs,
      healthCheckIntervalMs: config.redis.healthCheckIntervalMs,
    };

    this.circuitBreaker = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
    };
  }

  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      return;
    }

    if (this.circuitBreaker.state === 'OPEN') {
      const now = Date.now();
      const timeSinceLastFailure = now - this.circuitBreaker.lastFailureTime;
      
      // Circuit breaker timeout from config
      if (timeSinceLastFailure < config.redis.circuitBreakerTimeoutMs) {
        Logger.warn('Redis circuit breaker is OPEN, skipping connection attempt');
        return;
      } else {
        Logger.info('Redis circuit breaker transitioning to HALF_OPEN');
        this.circuitBreaker.state = 'HALF_OPEN';
        this.circuitBreaker.successCount = 0;
      }
    }

    try {
      await this.createConnection();
      this.onConnectionSuccess();
    } catch (error) {
      this.onConnectionFailure(error as Error);
      throw error;
    }
  }

  private async createConnection(): Promise<void> {
    this.client = createClient({
      url: this.cacheConfig.url,
      socket: {
        connectTimeout: this.cacheConfig.connectionTimeoutMs,
        reconnectStrategy: (retries) => {
          if (retries >= this.cacheConfig.maxRetries) {
            Logger.error(`Redis max retries (${this.cacheConfig.maxRetries}) exceeded`);
            return false;
          }
          
          const delay = Math.min(
            this.cacheConfig.retryDelayMs * Math.pow(2, retries),
            this.cacheConfig.maxRetryDelayMs
          );
          
          Logger.info(`Redis reconnect attempt ${retries + 1} in ${delay}ms`);
          return delay;
        },
      },
    });

    this.setupEventListeners();
    await this.client.connect();
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      Logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      Logger.info('Redis client ready');
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.onConnectionSuccess();
      this.startHealthCheck();
    });

    this.client.on('error', (err) => {
      Logger.error('Redis client error:', err);
      this.isConnected = false;
      this.onConnectionFailure(err);
    });

    this.client.on('disconnect', () => {
      Logger.warn('Redis client disconnected');
      this.isConnected = false;
      this.stopHealthCheck();
    });

    this.client.on('reconnecting', () => {
      Logger.info('Redis client reconnecting...');
      this.connectionAttempts++;
    });

    this.client.on('end', () => {
      Logger.warn('Redis client connection ended');
      this.isConnected = false;
      this.stopHealthCheck();
    });
  }

  private onConnectionSuccess(): void {
    this.circuitBreaker.failureCount = 0;
    
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.successCount++;
      if (this.circuitBreaker.successCount >= config.redis.circuitBreakerHalfOpenMaxCalls) {
        Logger.info('Redis circuit breaker closing after successful operations');
        this.circuitBreaker.state = 'CLOSED';
      }
    } else {
      this.circuitBreaker.state = 'CLOSED';
    }
  }

  private onConnectionFailure(error: Error): void {
    this.isConnected = false;
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();

    // Open circuit breaker after threshold consecutive failures
    if (this.circuitBreaker.failureCount >= config.redis.circuitBreakerThreshold) {
      Logger.error('Redis circuit breaker opening due to consecutive failures');
      this.circuitBreaker.state = 'OPEN';
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(
      this.cacheConfig.retryDelayMs * Math.pow(2, this.connectionAttempts),
      this.cacheConfig.maxRetryDelayMs
    );

    Logger.info(`Scheduling Redis reconnect in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        Logger.error('Redis reconnect failed:', error);
      }
    }, delay);
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        if (this.client && this.isConnected) {
          await this.client.ping();
          Logger.debug('Redis health check passed');
        }
      } catch (error) {
        Logger.error('Redis health check failed:', error);
        this.isConnected = false;
        this.onConnectionFailure(error as Error);
      }
    }, this.cacheConfig.healthCheckIntervalMs);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async disconnect(): Promise<void> {
    this.stopHealthCheck();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        Logger.info('Redis client disconnected gracefully');
      } catch (error) {
        Logger.error('Error during Redis disconnect:', error);
      }
    }
    
    this.isConnected = false;
    this.client = null;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isHealthy()) {
      Logger.debug('Cache miss: Redis not healthy', { key });
      return null;
    }

    try {
      const value = await this.client!.get(key);
      if (value === null) {
        return null;
      }
      
      const parsed = JSON.parse(value as string) as T;
      Logger.debug('Cache hit', { key });
      return parsed;
    } catch (error) {
      Logger.error('Cache get error:', error, { key });
      this.onConnectionFailure(error as Error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isHealthy()) {
      Logger.debug('Cache set skipped: Redis not healthy', { key });
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client!.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client!.set(key, serialized);
      }
      
      Logger.debug('Cache set', { key, ttl: ttlSeconds });
      return true;
    } catch (error) {
      Logger.error('Cache set error:', error, { key });
      this.onConnectionFailure(error as Error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isHealthy()) {
      Logger.debug('Cache delete skipped: Redis not healthy', { key });
      return false;
    }

    try {
      const result = await this.client!.del(key);
      Logger.debug('Cache delete', { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      Logger.error('Cache delete error:', error, { key });
      this.onConnectionFailure(error as Error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    if (!this.isHealthy()) {
      Logger.debug('Cache delete pattern skipped: Redis not healthy', { pattern });
      return false;
    }

    try {
      // Get all keys matching the pattern
      const keys = await this.client!.keys(pattern);
      
      if (keys.length === 0) {
        Logger.debug('Cache delete pattern: no keys found', { pattern });
        return true;
      }
      
      // Delete all matching keys
      const result = await this.client!.del(keys);
      Logger.debug('Cache delete pattern', { pattern, keysDeleted: result });
      return result > 0;
    } catch (error) {
      Logger.error('Cache delete pattern error:', error, { pattern });
      this.onConnectionFailure(error as Error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isHealthy()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      Logger.error('Cache exists error:', error, { key });
      this.onConnectionFailure(error as Error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    if (!this.isHealthy()) {
      Logger.debug('Cache clear skipped: Redis not healthy');
      return false;
    }

    try {
      await this.client!.flushAll();
      Logger.info('Cache cleared');
      return true;
    } catch (error) {
      Logger.error('Cache clear error:', error);
      this.onConnectionFailure(error as Error);
      return false;
    }
  }

  private isHealthy(): boolean {
    return this.client !== null && 
           this.isConnected && 
           this.circuitBreaker.state !== 'OPEN';
  }

  getHealthStatus(): {
    connected: boolean;
    circuitBreakerState: string;
    connectionAttempts: number;
    lastFailureTime: number;
  } {
    return {
      connected: this.isConnected,
      circuitBreakerState: this.circuitBreaker.state,
      connectionAttempts: this.connectionAttempts,
      lastFailureTime: this.circuitBreaker.lastFailureTime,
    };
  }
}

// Export singleton instance
export const cache = new CacheService();

// Export class for testing or custom instances
export { CacheService };