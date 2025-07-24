import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import httpMsg from '@utils/http_messages/http_msg';

const errorCod = 'ERROR_AUTH';

const auth = (plataform: string) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return new Promise((resolve) => {
        passport.authenticate(plataform, { session: false }, (err: any, user: object) => {
            if (err) {
                const result = httpMsg.http422(err, errorCod);
                res.status(result.httpStatusCode).json(result.data);
                resolve();
                return;
            }
            if (!user || Object.keys(user).length === 0) {
                const result = httpMsg.http401('Invalid token');
                res.status(result.httpStatusCode).json(result.data);
                resolve();
                return;
            }
            req.user = user;
            next();
            resolve();
        })(req, res, next);
    });
};

export default auth;
