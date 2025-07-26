import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../../utils/logger/winston/logger';
import config from '../../config/app';

const standardHeaders = true;
const legacyHeaders = false;

// Rate limiter básico (global)
const basicLimiter = rateLimit({
    windowMs: parseInt(config.ratelimiter.window) * 60 * 1000, // 15 minutes
    max: parseInt(config.ratelimiter.max),
    message: {
        success: false,
        message: 'Muitas tentativas. Tente novamente em alguns minutos.',
        retryAfter: parseInt(config.ratelimiter.window) * 60
    },
    standardHeaders,
    legacyHeaders,
    onLimitReached: (req: Request) => {
        logger.warn(`Rate limit atingido - IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    },
});

// Rate limiter para login (mais restritivo)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas por IP
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        retryAfter: 15 * 60
    },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests: true, // Não contar requests bem-sucedidos
    onLimitReached: (req: Request) => {
        logger.warn(`Login rate limit atingido - IP: ${req.ip}, Email tentativa: ${req.body?.email}`);
    },
});

// Rate limiter por usuário logado (usando ID do usuário)
const createUserLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: 'Limite de requisições por usuário atingido.',
            retryAfter: Math.floor(windowMs / 1000)
        },
        keyGenerator: (req: Request) => {
            // Usar ID do usuário se autenticado, senão IP
            const userId = req.user?.id;
            const clientId = userId || req.ip;
            
            // Log para monitoramento
            if (userId) {
                logger.debug(`Rate limit check - User ID: ${userId}`);
            } else {
                logger.debug(`Rate limit check - IP: ${req.ip}`);
            }
            
            return `user_${clientId}`;
        },
        standardHeaders,
        legacyHeaders,
        onLimitReached: (req: Request) => {
            const userId = req.user?.id;
            const identifier = userId ? `User ID: ${userId}` : `IP: ${req.ip}`;
            logger.warn(`User rate limit atingido - ${identifier}`);
        },
    });
};

// Rate limiter para APIs sensíveis (mais restritivo)
const apiSensitiveLimiter = createUserLimiter(15 * 60 * 1000, 20); // 20 requests por 15min

// Rate limiter para upload de arquivos
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 uploads por hora por IP
    message: {
        success: false,
        message: 'Limite de uploads atingido. Tente novamente em 1 hora.',
        retryAfter: 60 * 60
    },
    standardHeaders,
    legacyHeaders,
    onLimitReached: (req: Request) => {
        logger.warn(`Upload rate limit atingido - IP: ${req.ip}, User: ${req.user?.id || 'N/A'}`);
    },
});

// Rate limiter para busca (evitar spam de search)
const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 buscas por minuto
    message: {
        success: false,
        message: 'Muitas buscas. Aguarde um momento.',
        retryAfter: 60
    },
    keyGenerator: (req: Request) => {
        const userId = req.user?.id;
        return userId ? `search_user_${userId}` : `search_ip_${req.ip}`;
    },
    standardHeaders,
    legacyHeaders,
});

export default {
    limiter: basicLimiter,
    loginLimiter,
    userLimiter: createUserLimiter(),
    apiSensitiveLimiter,
    uploadLimiter,
    searchLimiter,
    createUserLimiter, // Export para uso customizado
};
