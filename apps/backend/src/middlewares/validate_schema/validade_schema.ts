import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';

import logger from '@utils/logger/winston/logger';

const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction): void => {
    try {
        schema.parse({
            body: req.body,
            params: req.params,
            query: req.query,
            headers: req.headers,
        });
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            logger.info(`Zod validation error. ${error.message}`);
            res.status(400).json(
                error.issues.map((issue) => ({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: issue.message,
                })),
            );
            return;
        } else {
            logger.info(`Server Internal error.`);
            res.status(500).json({
                error: {
                    code: 500,
                    error: 'SERVER_ERROR',
                    message: 'Internal Server Error',
                },
            });
            return;
        }
    }
};

export { validate };
