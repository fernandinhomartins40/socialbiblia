import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import logsPath from 'app-root-path';
import path from 'path';
import fs from 'fs';

// Configurações baseadas no ambiente
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug');

// Configurar diretório de logs
const logsDir = process.env.LOGS_DIR || logsPath.resolve('/logs/');

// Garantir que o diretório de logs existe
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Formato estruturado para logs
const structuredFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ 
        fillExcept: ['message', 'level', 'timestamp', 'label']
    }),
    winston.format.json(),
);

// Formato para console (mais legível em desenvolvimento)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.colorize({ all: true }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
        const { timestamp, level, message, requestId, userId, ...meta } = info;
        
        let logMessage = `${timestamp} [${level}]`;
        
        // Adicionar contexto se disponível
        if (requestId) logMessage += ` [${requestId}]`;
        if (userId) logMessage += ` [user:${userId}]`;
        
        logMessage += ` ${message}`;
        
        // Adicionar metadata se houver
        if (Object.keys(meta).length > 0) {
            logMessage += ` ${JSON.stringify(meta, null, 2)}`;
        }
        
        return logMessage;
    })
);

// Transports configuráveis
const transports: winston.transport[] = [];

// Console transport (sempre presente em desenvolvimento)
if (isDevelopment || process.env.LOG_CONSOLE === 'true') {
    transports.push(new winston.transports.Console({
        level: logLevel,
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true,
    }));
}

// File transports (sempre em produção, opcional em desenvolvimento)
if (isProduction || process.env.LOG_FILES === 'true') {
    // Log de erro
    transports.push(new DailyRotateFile({
        level: 'error',
        dirname: logsDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: process.env.LOG_MAX_FILES || '30d',
        zippedArchive: true,
        format: structuredFormat,
        handleExceptions: true,
        handleRejections: true,
    }));

    // Log combinado (warn e acima)
    transports.push(new DailyRotateFile({
        level: 'warn',
        dirname: logsDir,
        filename: 'combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        zippedArchive: true,
        format: structuredFormat,
    }));

    // Log de debug (apenas se DEBUG_LOGS estiver habilitado)
    if (process.env.DEBUG_LOGS === 'true') {
        transports.push(new DailyRotateFile({
            level: 'debug',
            dirname: logsDir,
            filename: 'debug-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: process.env.LOG_MAX_SIZE || '5m',
            maxFiles: process.env.LOG_MAX_FILES || '7d',
            zippedArchive: true,
            format: structuredFormat,
        }));
    }

    // Log de auditoria/info
    transports.push(new DailyRotateFile({
        level: 'info',
        dirname: logsDir,
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: process.env.LOG_MAX_FILES || '30d',
        zippedArchive: true,
        format: structuredFormat,
    }));
}

// Criar logger principal
const logger = winston.createLogger({
    level: logLevel,
    format: structuredFormat,
    transports,
    exitOnError: false,
    // Configurações avançadas
    defaultMeta: {
        service: 'socialbiblia-api',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    },
});

// Adicionar métodos utilitários
const loggerWithUtils = {
    ...logger,
    
    // Log com contexto de usuário
    logUser: (level: string, message: string, userId?: string, extra?: any) => {
        logger.log(level, message, { userId, ...extra });
    },
    
    // Log com contexto de requisição
    logRequest: (level: string, message: string, req?: any, extra?: any) => {
        const requestContext = req ? {
            requestId: req.headers['x-request-id'],
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
        } : {};
        
        logger.log(level, message, { ...requestContext, ...extra });
    },
    
    // Log de performance
    logPerformance: (operation: string, duration: number, extra?: any) => {
        logger.info(`Performance: ${operation}`, {
            operation,
            duration,
            unit: 'ms',
            ...extra
        });
    },
    
    // Log de segurança
    logSecurity: (event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
        const level = severity === 'critical' ? 'error' : 
                     severity === 'high' ? 'error' :
                     severity === 'medium' ? 'warn' : 'info';
        
        logger.log(level, `Security Event: ${event}`, {
            securityEvent: event,
            severity,
            ...details
        });
    },
    
    // Stream para Morgan (HTTP logs)
    stream: {
        write: (message: string) => {
            logger.info(message.trim(), { source: 'http' });
        },
    },
};

// Log de inicialização
logger.info('Logger configurado', {
    logLevel,
    isProduction,
    logsDir,
    transportsCount: transports.length,
});

export default loggerWithUtils;