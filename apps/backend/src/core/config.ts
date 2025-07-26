import appConfig from '../config/app';
import databaseConfig from '../config/database';
import emailConfig from '../config/email';

// Export types to avoid TS4023 errors
export type { IApi, IApp, ICors, IDebug, IRatelimiter, ISsl } from '../config/app/types';
export type { IDatabase } from '../config/database/types';

// Centralizar todas as configurações em um objeto
export const config = {
    ...appConfig,
    database: databaseConfig,
    email: emailConfig,
    
    // Configurações adicionais que podem ser referenciadas
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    
    // JWT configs
    jwt: {
        userSecret: process.env.JWT_SECRET_USER || 'default-user-secret',
        deviceSecret: process.env.JWT_SECRET_DEVICE || 'default-device-secret',
        secret: process.env.JWT_SECRET_USER || 'default-user-secret', // Alias para compatibilidade
        refreshSecret: process.env.JWT_SECRET_DEVICE || 'default-refresh-secret',
        expiresIn: process.env.JWT_EXPIRED_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRED_IN || '7d'
    },
    
    // Security configs
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALTROUNDS || '12')
    },
    
    // Rate limiting
    rateLimit: {
        max: parseInt(process.env.RATE_LIMIT_MAX || '500'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000 // Convert to ms
    },
    
    // Server configs
    server: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.APP_URL_PORT || '3000')
    },
    
    // Logging configs
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    },
    
    // Redis configs (para cache)
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
        retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
        maxRetryDelayMs: parseInt(process.env.REDIS_MAX_RETRY_DELAY || '3000'),
        connectionTimeoutMs: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000'),
        commandTimeoutMs: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
        healthCheckIntervalMs: parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL || '30000'),
        circuitBreakerTimeoutMs: parseInt(process.env.REDIS_CIRCUIT_BREAKER_TIMEOUT || '60000'),
        circuitBreakerThreshold: parseInt(process.env.REDIS_CIRCUIT_BREAKER_THRESHOLD || '5'),
        circuitBreakerHalfOpenMaxCalls: parseInt(process.env.REDIS_CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS || '3')
    }
};

export default config; 