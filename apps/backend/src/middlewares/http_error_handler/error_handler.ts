import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger/winston/logger';

// Classes de erro customizadas
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;
    public readonly isOperational: boolean;
    public readonly timestamp: string;
    public readonly requestId?: string;

    constructor(
        message: string,
        statusCode: number = 500,
        errorCode: string = 'INTERNAL_ERROR',
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Acesso não autorizado') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Acesso proibido') {
        super(message, 403, 'FORBIDDEN_ERROR');
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Recurso não encontrado') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflito de dados') {
        super(message, 409, 'CONFLICT_ERROR');
        this.name = 'ConflictError';
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Muitas requisições') {
        super(message, 429, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
    }
}

// Interface para resposta de erro padronizada
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        statusCode: number;
        timestamp: string;
        requestId?: string;
        details?: any;
        stack?: string;
    };
}

// Função para detectar se é erro operacional
const isOperationalError = (error: Error): boolean => {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
};

// Função para gerar ID único da requisição
const generateRequestId = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Middleware principal de tratamento de erro
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string || generateRequestId();
    const isProduction = process.env.NODE_ENV === 'production';
    
    let error = err;

    // Converter erros conhecidos para AppError
    if (err.name === 'ValidationError') {
        error = new ValidationError(err.message);
    } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        error = new AuthenticationError('Token inválido ou expirado');
    } else if (err.name === 'TokenExpiredError') {
        error = new AuthenticationError('Token expirado');
    } else if (err.name === 'CastError') {
        error = new ValidationError('ID inválido fornecido');
    } else if (err.code === 11000) {
        // Erro de duplicação do MongoDB
        const field = Object.keys(err.keyValue)[0];
        error = new ConflictError(`${field} já existe`);
    }

    // Garantir que temos um AppError
    if (!(error instanceof AppError)) {
        error = new AppError(
            isProduction ? 'Erro interno do servidor' : err.message,
            500,
            'INTERNAL_ERROR',
            false
        );
    }

    error.requestId = requestId;

    // Log do erro
    const logData = {
        message: error.message,
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        stack: error.stack,
        isOperational: error.isOperational,
    };

    if (error.statusCode >= 500) {
        logger.error('Server Error:', logData);
    } else if (error.statusCode >= 400) {
        logger.warn('Client Error:', logData);
    }

    // Construir resposta
    const errorResponse: ErrorResponse = {
        success: false,
        error: {
            code: error.errorCode,
            message: error.message,
            statusCode: error.statusCode,
            timestamp: error.timestamp || new Date().toISOString(),
            requestId: error.requestId,
        },
    };

    // Adicionar detalhes em desenvolvimento
    if (!isProduction) {
        errorResponse.error.stack = error.stack;
        errorResponse.error.details = {
            originalError: err.name,
            method: req.method,
            url: req.originalUrl,
        };
    }

    // Responder com erro
    res.status(error.statusCode).json(errorResponse);
};

// Middleware para capturar rotas não encontradas
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new NotFoundError(`Rota ${req.originalUrl} não encontrada`);
    next(error);
};

// Middleware para adicionar request ID
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || generateRequestId();
    res.setHeader('X-Request-ID', req.headers['x-request-id']);
    next();
};

// Handler para erros não capturados
export const handleUncaughtException = () => {
    process.on('uncaughtException', (err: Error) => {
        logger.error('Uncaught Exception:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
        });
        
        // Forçar saída do processo em caso de erro não operacional
        if (!isOperationalError(err)) {
            process.exit(1);
        }
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        logger.error('Unhandled Rejection:', {
            reason: reason.message || reason,
            stack: reason.stack,
            promise: promise.toString(),
        });

        // Forçar saída do processo em caso de erro não operacional  
        if (!isOperationalError(reason)) {
            process.exit(1);
        }
    });
};

export default errorHandler;