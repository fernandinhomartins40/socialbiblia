import rateLimit from 'express-rate-limit';
import { config } from '../core/config';
import { Request } from 'express';

// Rate limiter geral
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Muitas requisições, tente novamente mais tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Usar user ID se autenticado, senão IP
    const userId = (req as any).user?.userId;
    return userId ? `user:${userId}` : req.ip || 'unknown';
  },
});

// Rate limiter para autenticação (mais restritivo)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Muitas tentativas de login, tente novamente em 15 minutos',
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => `auth:${req.ip}`,
});

// Rate limiter restrito para operações sensíveis
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requisições por minuto
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Muitas requisições, tente novamente em 1 minuto',
  },
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.userId;
    return userId ? `strict:user:${userId}` : `strict:ip:${req.ip}`;
  },
});

// Rate limiter para criação de conteúdo
export const createContentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 posts por minuto
  message: {
    success: false,
    error: 'Too many content creation requests',
    message: 'Muitas criações de conteúdo, tente novamente em 1 minuto',
  },
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.userId;
    return `create:${userId || req.ip}`;
  },
});

// Rate limiter para operações de busca
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 buscas por minuto
  message: {
    success: false,
    error: 'Too many search requests',
    message: 'Muitas requisições de busca, tente novamente em 1 minuto',
  },
  keyGenerator: (req: Request) => `search:${req.ip}`,
});