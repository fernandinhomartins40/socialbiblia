import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../core/config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { JwtPayload } from '../types/auth';
import { Logger, ErrorCodes } from '../utils/logger';
import { prisma } from '../core/database';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  const context = {
    requestId: req.headers['x-request-id'] as string,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl,
  };

  if (!token) {
    Logger.warn('Authentication failed: no token provided', {
      ...context,
      errorCode: ErrorCodes.UNAUTHORIZED,
    });
    throw new UnauthorizedError('Token de autenticação não fornecido');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Verificar se o usuário ainda existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      Logger.warn('Authentication failed: user not found or inactive', {
        ...context,
        userId: decoded.userId,
        errorCode: ErrorCodes.UNAUTHORIZED,
      });
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    req.user = decoded;
    
    Logger.debug('User authenticated successfully', {
      ...context,
      userId: decoded.userId,
    });
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      Logger.warn('Authentication failed: invalid token', {
        ...context,
        errorCode: ErrorCodes.TOKEN_INVALID,
        metadata: { jwtError: (error as Error).message },
      });
      throw new UnauthorizedError('Token inválido');
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      Logger.warn('Authentication failed: token expired', {
        ...context,
        errorCode: ErrorCodes.TOKEN_EXPIRED,
      });
      throw new UnauthorizedError('Token expirado');
    }
    
    throw error;
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const context = {
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.userId,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
    };

    if (!req.user) {
      Logger.warn('Authorization failed: user not authenticated', {
        ...context,
        errorCode: ErrorCodes.UNAUTHORIZED,
      });
      throw new UnauthorizedError('Usuário não autenticado');
    }

    if (!roles.includes(req.user.role)) {
      Logger.warn('Authorization failed: insufficient permissions', {
        ...context,
        errorCode: ErrorCodes.FORBIDDEN,
        metadata: {
          userRole: req.user.role,
          requiredRoles: roles,
        },
      });
      throw new ForbiddenError(`Acesso negado. Roles necessárias: ${roles.join(', ')}`);
    }

    Logger.debug('User authorized successfully', {
      ...context,
      metadata: { userRole: req.user.role },
    });

    next();
  };
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      // Verificar se o usuário ainda existe e está ativo
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true },
      });

      if (user && user.isActive) {
        req.user = decoded;
      }
    } catch {
      // Token inválido, mas não bloqueia a requisição
      Logger.debug('Optional auth: invalid token ignored', {
        requestId: req.headers['x-request-id'] as string,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
      });
    }
  }

  next();
}
