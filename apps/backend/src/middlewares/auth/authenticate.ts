import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import httpMsg from '@utils/http_messages/http_msg';

const errorCod = 'ERROR_AUTH';

const auth = (plataform: string) => async (req: Request, res: Response, next: NextFunction) => {
    await passport.authenticate(plataform, { session: false }, (err: any, user: Express.User | false | undefined) => {
        if (err) {
            const result = httpMsg.http422(err, errorCod);
            return res.status(result.httpStatusCode).json(result.data);
        }
        if (!user) {
            const result = httpMsg.http401('Invalid token');
            return res.status(result.httpStatusCode).json(result.data);
        }
        req.user = user;
        next();
    })(req, res, next);
};

export default auth;
