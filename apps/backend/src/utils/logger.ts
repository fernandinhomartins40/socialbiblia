import winston from 'winston';
import { config } from '../core/config';

// Definir códigos de erro padronizados
export enum ErrorCodes {
  // Auth errors (1000-1999)
  INVALID_CREDENTIALS = 'AUTH_1001',
  TOKEN_EXPIRED = 'AUTH_1002',
  TOKEN_INVALID = 'AUTH_1003',
  UNAUTHORIZED = 'AUTH_1004',
  FORBIDDEN = 'AUTH_1005',
  
  // Validation errors (2000-2999)
  VALIDATION_FAILED = 'VAL_2001',
  INVALID_INPUT = 'VAL_2002',
  MISSING_REQUIRED_FIELD = 'VAL_2003',
  
  // Database errors (3000-3999)
  DATABASE_CONNECTION = 'DB_3001',
  RECORD_NOT_FOUND = 'DB_3002',
  DUPLICATE_ENTRY = 'DB_3003',
  CONSTRAINT_VIOLATION = 'DB_3004',
  
  // Business logic errors (4000-4999)
  BUSINESS_RULE_VIOLATION = 'BIZ_4001',
  RESOURCE_LIMIT_EXCEEDED = 'BIZ_4002',
  
  // System errors (5000-5999)
  INTERNAL_SERVER_ERROR = 'SYS_5001',
  SERVICE_UNAVAILABLE = 'SYS_5002',
  EXTERNAL_SERVICE_ERROR = 'SYS_5003',
}

// Interface para contexto estruturado de logs
export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  errorCode?: ErrorCodes;
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional properties
}

// Formato customizado para logs estruturados
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      service: 'plugbase-backend',
      environment: config.server.nodeEnv,
      ...meta,
    };
    return JSON.stringify(logEntry, null, config.server.nodeEnv === 'development' ? 2 : 0);
  })
);

// Criar logger Winston estruturado
export const structuredLogger = winston.createLogger({
  level: config.logging.level,
  format: structuredFormat,
  defaultMeta: { 
    service: 'plugbase-backend',
    environment: config.server.nodeEnv 
  },
  transports: [
    new winston.transports.Console({
      format: config.server.nodeEnv === 'development' 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : structuredFormat
    }),
  ],
});

// Adicionar transporte de arquivo em produção
if (config.server.nodeEnv === 'production') {
  structuredLogger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    format: structuredFormat
  }));
  structuredLogger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    format: structuredFormat
  }));
}

// Funções utilitárias para logging estruturado
export class Logger {
  static info(message: string, context?: LogContext) {
    structuredLogger.info(message, context);
  }

  static warn(message: string, context?: LogContext) {
    structuredLogger.warn(message, context);
  }

  static error(message: string, error?: Error, context?: LogContext) {
    structuredLogger.error(message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  static debug(message: string, context?: LogContext) {
    structuredLogger.debug(message, context);
  }

  static http(message: string, context: LogContext) {
    const level = (context.statusCode && context.statusCode >= 400) ? 'warn' : 'info';
    structuredLogger.log(level, message, context);
  }
}