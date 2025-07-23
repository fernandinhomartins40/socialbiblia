import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ResponseUtil } from '../utils/responses';
import { Logger, ErrorCodes } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const context = {
    requestId: req.headers['x-request-id'] as string,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };

  Logger.error('Request error occurred', error, context);

  if (error instanceof AppError) {
    Logger.warn('Application error', {
      ...context,
      statusCode: error.statusCode,
      errorCode: error.statusCode === 401 ? ErrorCodes.UNAUTHORIZED : 
                 error.statusCode === 403 ? ErrorCodes.FORBIDDEN :
                 error.statusCode === 404 ? ErrorCodes.RECORD_NOT_FOUND :
                 ErrorCodes.BUSINESS_RULE_VIOLATION,
    });
    
    return res.status(error.statusCode).json(
      ResponseUtil.error(error.message, undefined, {
        timestamp: new Date().toISOString(),
      })
    );
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as unknown as { code: string; meta?: { target?: string[] } };
    
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'campo';
      Logger.warn('Database constraint violation', {
        ...context,
        statusCode: 409,
        errorCode: ErrorCodes.DUPLICATE_ENTRY,
        metadata: { field, prismaCode: prismaError.code },
      });
      
      return res.status(409).json(
        ResponseUtil.error('Conflito de dados', `${field} já existe`, {
          timestamp: new Date().toISOString(),
        })
      );
    }
    
    if (prismaError.code === 'P2025') {
      Logger.warn('Database record not found', {
        ...context,
        statusCode: 404,
        errorCode: ErrorCodes.RECORD_NOT_FOUND,
        metadata: { prismaCode: prismaError.code },
      });
      
      return res.status(404).json(
        ResponseUtil.error('Registro não encontrado', undefined, {
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  // Zod validation errors
  if (error.name === 'ValidationError') {
    const validationError = error as unknown as { errors: { field: string; message: string }[] };
    return res.status(400).json(
      ResponseUtil.validation(validationError.errors || [])
    );
  }

  // Default error
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : error.message;

  Logger.error('Unhandled server error', error, {
    ...context,
    statusCode,
    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
  });

  return res.status(statusCode).json(
    ResponseUtil.error(message, undefined, {
      timestamp: new Date().toISOString(),
    })
  );
}
