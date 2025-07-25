import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, validationResult } from 'express-validator';
import auth from '../middlewares/auth/authenticate';

// Rate limiters
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 login requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const createContentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 create requests per windowMs
    message: 'Too many content creation requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Authentication middlewares
export const authenticateToken = auth('jwt');
export const authenticate = auth('jwt');

// Authorization middleware
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !('role' in req.user)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRole = (req.user as any).role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        next();
    };
};

// Validation middlewares
export const validateRequest = (schema: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            res.status(400).json({ error: 'Validation failed', details: error });
        }
    };
};

export const validateQuery = (schema: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.query);
            next();
        } catch (error) {
            res.status(400).json({ error: 'Query validation failed', details: error });
        }
    };
}; 