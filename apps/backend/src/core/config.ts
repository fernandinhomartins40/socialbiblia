import dotenv from 'dotenv';
import * as net from 'net';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'plugbase-backend',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/plugbase',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },
  redis: {
    // Connection Configuration
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    database: parseInt(process.env.REDIS_DATABASE || '0', 10),
    
    // Connection Pool Configuration
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10),
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '5', 10),
    retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY_MS || '1000', 10),
    maxRetryDelayMs: parseInt(process.env.REDIS_MAX_RETRY_DELAY_MS || '30000', 10),
    
    // Timeout Configuration
    connectionTimeoutMs: parseInt(process.env.REDIS_CONNECTION_TIMEOUT_MS || '10000', 10),
    commandTimeoutMs: parseInt(process.env.REDIS_COMMAND_TIMEOUT_MS || '5000', 10),
    lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
    
    // Health Check Configuration
    healthCheckIntervalMs: parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL_MS || '30000', 10),
    enableHealthCheck: process.env.REDIS_ENABLE_HEALTH_CHECK !== 'false',
    
    // Circuit Breaker Configuration
    circuitBreakerThreshold: parseInt(process.env.REDIS_CIRCUIT_BREAKER_THRESHOLD || '5', 10),
    circuitBreakerTimeoutMs: parseInt(process.env.REDIS_CIRCUIT_BREAKER_TIMEOUT_MS || '60000', 10),
    circuitBreakerHalfOpenMaxCalls: parseInt(process.env.REDIS_CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS || '3', 10),
    
    // Performance Configuration
    enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE !== 'false',
    maxMemoryPolicy: process.env.REDIS_MAX_MEMORY_POLICY || 'allkeys-lru',
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'plugbase:',
    
    // Security Configuration
    enableTLS: process.env.REDIS_ENABLE_TLS === 'true',
    tlsCertPath: process.env.REDIS_TLS_CERT_PATH || '',
    tlsKeyPath: process.env.REDIS_TLS_KEY_PATH || '',
    tlsCaPath: process.env.REDIS_TLS_CA_PATH || '',
    
    // Cluster Configuration (for Redis Cluster mode)
    enableCluster: process.env.REDIS_ENABLE_CLUSTER === 'true',
    clusterNodes: process.env.REDIS_CLUSTER_NODES?.split(',') || [],
    clusterOptions: {
      enableReadyCheck: process.env.REDIS_CLUSTER_READY_CHECK !== 'false',
      redisOptions: {
        password: process.env.REDIS_PASSWORD || '',
      },
      maxRedirections: parseInt(process.env.REDIS_CLUSTER_MAX_REDIRECTIONS || '16', 10),
      retryDelayOnFailover: parseInt(process.env.REDIS_CLUSTER_RETRY_DELAY_ON_FAILOVER || '100', 10),
    },
    
    // Monitoring and Observability
    enableMetrics: process.env.REDIS_ENABLE_METRICS !== 'false',
    metricsInterval: parseInt(process.env.REDIS_METRICS_INTERVAL || '60000', 10),
    enableEventLogging: process.env.REDIS_ENABLE_EVENT_LOGGING !== 'false',
    
    // Cache TTL Defaults
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10), // 1 hour
    sessionTTL: parseInt(process.env.REDIS_SESSION_TTL || '86400', 10), // 24 hours
    cacheTTL: parseInt(process.env.REDIS_CACHE_TTL || '1800', 10), // 30 minutes
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },
  datadog: {
    apiKey: process.env.DATADOG_API_KEY || '',
  },
};

// Função para detectar porta disponível
export async function findAvailablePort(startPort: number = 3000): Promise<number> {
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const address = server.address();
      const port = typeof address === 'string' ? startPort : address?.port ?? startPort;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Configuração dinâmica de porta apenas se necessário
// Esta função será chamada no app.ts se a porta estiver ocupada
