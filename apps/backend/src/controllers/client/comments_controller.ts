import { Request, Response, NextFunction } from 'express';
import presenter from '@services/client/comments';
import logger from '@utils/logger/winston/logger';

const createComment = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.id;
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'USER_NOT_AUTHENTICATED'
        });
    }

    const commentData = {
        ...req.body,
        authorId: userId
    };

    presenter
        .createComment(commentData)
        .then((result: any) => res.status(result.httpStatusCode).json(result.data))
        .catch((err: any) => {
            logger.error(`Create comment error. ${err.message}`);
            next(err);
        });
};

export default {
    createComment,
};