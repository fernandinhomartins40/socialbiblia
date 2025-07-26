import logger from '../../utils/logger/winston/logger';
import { cache } from '../../config/redis';
import { prisma } from '../../core/database';
import { Request, Response, NextFunction } from 'express';

// Interface para métricas de performance
interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  databaseQueries: number;
  cacheHits: number;
  cacheMisses: number;
  activeConnections: number;
  errorRate: number;
}

// Interface para métricas de API
interface ApiMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent: string;
  ip: string;
  timestamp: Date;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private apiMetrics: ApiMetrics[] = [];
  private startTime: number = Date.now();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Middleware para monitorar requisições HTTP
  public requestMonitor(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const startMemory = process.memoryUsage();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const endMemory = process.memoryUsage();

      // Store API metrics
      const apiMetric: ApiMetrics = {
        endpoint: req.path,
        method: req.method,
        responseTime: duration,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent') || 'unknown',
        ip: req.ip || 'unknown',
        timestamp: new Date(),
      };

      this.recordApiMetric(apiMetric);

      // Log slow requests (> 500ms)
      if (duration > 500) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          statusCode: res.statusCode,
          memoryDelta: {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
          },
        });
      }

      // Log errors
      if (res.statusCode >= 400) {
        logger.error('HTTP Error', {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        });
      }
    });

    next();
  }

  // Registrar métricas de API
  private recordApiMetric(metric: ApiMetrics): void {
    this.apiMetrics.push(metric);
    
    // Manter apenas as últimas 1000 métricas
    if (this.apiMetrics.length > 1000) {
      this.apiMetrics = this.apiMetrics.slice(-1000);
    }

    // Atualizar cache com métricas agregadas
    this.updateAggregatedMetrics();
  }

  // Atualizar métricas agregadas no cache
  private async updateAggregatedMetrics(): Promise<void> {
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentApiMetrics = this.apiMetrics.filter(
      m => m.timestamp > last5Minutes
    );

    const aggregated = {
      api: {
        totalRequests: recentApiMetrics.length,
        averageResponseTime: recentApiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentApiMetrics.length || 0,
        errorRate: recentApiMetrics.filter(m => m.statusCode >= 400).length / recentApiMetrics.length || 0,
        requestsPerMinute: recentApiMetrics.length / 5,
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date(),
      },
    };

    // Armazenar no cache Redis
    await cache.set('performance:metrics', aggregated, 300); // 5 minutos
  }

  // Obter métricas de performance atuais
  public async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Obter estatísticas de cache
    try {
      const cacheStats = await cache.keys('*');
      const cacheHits = cacheStats.length;
      const cacheMisses = 0; // Simplificado

      // Obter conexões ativas do banco
      const activeConnections = await prisma.$queryRaw`SELECT count(*) as connections FROM pg_stat_activity WHERE state = 'active'`;

      return {
        responseTime: 0,
        memoryUsage,
        cpuUsage: cpuUsage.user + cpuUsage.system,
        databaseQueries: 0,
        cacheHits,
        cacheMisses,
        activeConnections: (activeConnections as any)[0]?.connections || 0,
        errorRate: this.calculateErrorRate(),
      };
    } catch (error) {
      logger.error('Error getting performance metrics', { error });
      return {
        responseTime: 0,
        memoryUsage,
        cpuUsage: cpuUsage.user + cpuUsage.system,
        databaseQueries: 0,
        cacheHits: 0,
        cacheMisses: 0,
        activeConnections: 0,
        errorRate: 0,
      };
    }
  }

  // Calcular taxa de erro
  private calculateErrorRate(): number {
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
    const recentMetrics = this.apiMetrics.filter(
      m => m.timestamp > last5Minutes
    );

    if (recentMetrics.length === 0) return 0;

    const errors = recentMetrics.filter(m => m.statusCode >= 400).length;
    return errors / recentMetrics.length;
  }

  // Obter métricas detalhadas
  public async getDetailedMetrics() {
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentApiMetrics = this.apiMetrics.filter(
      m => m.timestamp > last5Minutes
    );

    // Agrupar por endpoint
    const endpointStats = recentApiMetrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalTime: 0,
          errors: 0,
          averageTime: 0,
        };
      }
      
      acc[key].count++;
      acc[key].totalTime += metric.responseTime;
      if (metric.statusCode >= 400) acc[key].errors++;
      acc[key].averageTime = acc[key].totalTime / acc[key].count;
      
      return acc;
    }, {} as Record<string, any>);

    return {
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date(),
      },
      api: {
        totalRequests: recentApiMetrics.length,
        averageResponseTime: recentApiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentApiMetrics.length || 0,
        errorRate: recentApiMetrics.filter(m => m.statusCode >= 400).length / recentApiMetrics.length || 0,
        requestsPerMinute: recentApiMetrics.length / 5,
        endpointStats,
      },
    };
  }

  // Health check com métricas
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: any;
    issues: string[];
  }> {
    const metrics = await this.getDetailedMetrics();
    const issues: string[] = [];

    // Verificar se há problemas
    if (metrics.api.averageResponseTime > 1000) {
      issues.push('Average response time is high');
    }

    if (metrics.api.errorRate > 0.05) {
      issues.push('Error rate is high');
    }

    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      issues.push('Memory usage is high');
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 2) {
      status = 'unhealthy';
    } else if (issues.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      metrics,
      issues,
    };
  }

  // Limpar métricas antigas
  public clearMetrics(): void {
    this.apiMetrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
