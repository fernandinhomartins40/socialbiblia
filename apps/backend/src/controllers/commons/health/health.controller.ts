import { Request, Response } from 'express';
import { cache } from '../../../utils/cache';
import { config } from '../../../core/config';
import { Logger } from '../../../utils/logger';
import { PrismaClient } from '@prisma/client';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    redis: ServiceHealth;
    database: ServiceHealth;
    memory: ServiceHealth;
    filesystem: ServiceHealth;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    loadAverage: number[];
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  details?: any;
  error?: string;
  lastChecked: string;
}

const prisma = new PrismaClient();

class HealthController {
  /**
   * Comprehensive health check endpoint
   * GET /api/health
   */
  async check(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      Logger.debug('Starting comprehensive health check');
      
      // Run all health checks in parallel
      const [redisHealth, databaseHealth, memoryHealth, filesystemHealth] = await Promise.allSettled([
        this.checkRedis(),
        this.checkDatabase(),
        this.checkMemory(),
        this.checkFilesystem(),
      ]);

      const healthResult: HealthCheckResult = {
        status: this.calculateOverallStatus([
          this.getResultValue(redisHealth),
          this.getResultValue(databaseHealth),
          this.getResultValue(memoryHealth),
          this.getResultValue(filesystemHealth),
        ]),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.server.nodeEnv,
        uptime: process.uptime(),
        services: {
          redis: this.getResultValue(redisHealth),
          database: this.getResultValue(databaseHealth),
          memory: this.getResultValue(memoryHealth),
          filesystem: this.getResultValue(filesystemHealth),
        },
        metrics: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          loadAverage: require('os').loadavg(),
        },
      };

      const responseTime = Date.now() - startTime;
      Logger.info('Health check completed', { 
        status: healthResult.status, 
        responseTime: `${responseTime}ms` 
      });

      // Set appropriate status code
      const statusCode = healthResult.status === 'healthy' ? 200 : 
                        healthResult.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthResult);
    } catch (error) {
      Logger.error('Health check failed:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Quick health check endpoint for load balancers
   * GET /api/health/quick
   */
  async quickCheck(req: Request, res: Response): Promise<void> {
    try {
      const result = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };

      res.status(200).json(result);
    } catch (error) {
      Logger.error('Quick health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
      });
    }
  }

  /**
   * Redis health check endpoint
   * GET /api/health/redis
   */
  async redisHealth(req: Request, res: Response): Promise<void> {
    try {
      const redisHealth = await this.checkRedis();
      const statusCode = redisHealth.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        service: 'redis',
        ...redisHealth,
      });
    } catch (error) {
      Logger.error('Redis health check failed:', error);
      res.status(503).json({
        service: 'redis',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      });
    }
  }

  /**
   * Database health check endpoint
   * GET /api/health/database
   */
  async databaseHealth(req: Request, res: Response): Promise<void> {
    try {
      const dbHealth = await this.checkDatabase();
      const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        service: 'database',
        ...dbHealth,
      });
    } catch (error) {
      Logger.error('Database health check failed:', error);
      res.status(503).json({
        service: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      });
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Get Redis health status from cache service
      const cacheHealth = cache.getHealthStatus();
      
      if (!cacheHealth.connected) {
        return {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: 'Redis not connected',
          details: {
            circuitBreakerState: cacheHealth.circuitBreakerState,
            connectionAttempts: cacheHealth.connectionAttempts,
            lastFailureTime: cacheHealth.lastFailureTime ? new Date(cacheHealth.lastFailureTime).toISOString() : null,
          },
          lastChecked: new Date().toISOString(),
        };
      }

      // Test Redis operations
      const testKey = `health_check_${Date.now()}`;
      const testValue = { test: true, timestamp: new Date().toISOString() };
      
      // Test SET operation
      await cache.set(testKey, testValue, 5); // 5 seconds TTL
      
      // Test GET operation
      const retrieved = await cache.get(testKey);
      
      // Test DELETE operation
      await cache.del(testKey);
      
      const responseTime = Date.now() - startTime;
      
      // Determine status based on response time
      const status = responseTime > 1000 ? 'degraded' : 'healthy';
      
      return {
        status,
        responseTime,
        details: {
          circuitBreakerState: cacheHealth.circuitBreakerState,
          connectionAttempts: cacheHealth.connectionAttempts,
          testOperations: {
            set: true,
            get: retrieved !== null,
            delete: true,
          },
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      Logger.error('Redis health check error:', error);
      
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown Redis error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Test database connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      // Determine status based on response time
      const status = responseTime > 2000 ? 'degraded' : 'healthy';
      
      return {
        status,
        responseTime,
        details: {
          connection: 'active',
          databaseUrl: config.database.url.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      Logger.error('Database health check error:', error);
      
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkMemory(): Promise<ServiceHealth> {
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const freeMemory = require('os').freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      // Consider memory usage above 90% as degraded, above 95% as unhealthy
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (memoryUsagePercent > 95) {
        status = 'unhealthy';
      } else if (memoryUsagePercent > 90) {
        status = 'degraded';
      }
      
      return {
        status,
        details: {
          system: {
            total: Math.round(totalMemory / 1024 / 1024), // MB
            used: Math.round(usedMemory / 1024 / 1024), // MB
            free: Math.round(freeMemory / 1024 / 1024), // MB
            usagePercent: Math.round(memoryUsagePercent * 100) / 100,
          },
          process: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          },
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      Logger.error('Memory health check error:', error);
      
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown memory error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkFilesystem(): Promise<ServiceHealth> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Test file system operations
      const testDir = path.join(process.cwd(), 'tmp');
      const testFile = path.join(testDir, `health_check_${Date.now()}.txt`);
      
      try {
        // Ensure tmp directory exists
        await fs.mkdir(testDir, { recursive: true });
        
        // Test write operation
        await fs.writeFile(testFile, 'health check test');
        
        // Test read operation
        await fs.readFile(testFile, 'utf8');
        
        // Test delete operation
        await fs.unlink(testFile);
        
        return {
          status: 'healthy',
          details: {
            operations: {
              write: true,
              read: true,
              delete: true,
            },
            workingDirectory: process.cwd(),
          },
          lastChecked: new Date().toISOString(),
        };
      } catch (fsError) {
        return {
          status: 'unhealthy',
          error: `Filesystem operations failed: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      Logger.error('Filesystem health check error:', error);
      
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown filesystem error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private calculateOverallStatus(services: ServiceHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    const hasUnhealthy = services.some(service => service.status === 'unhealthy');
    const hasDegraded = services.some(service => service.status === 'degraded');
    
    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }

  private getResultValue(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }
}

export default new HealthController(); 