import { Request, Response, NextFunction } from 'express';
import presenter from '@services/client/comments';
import logger from '@utils/logger/winston/logger';
import { ServiceResponse } from '@utils/types/express';
import { CreateCommentData } from '@utils/types/posts';

const createComment = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'USER_NOT_AUTHENTICATED'
        });
    }

    const commentData: CreateCommentData = {
        ...req.body,
        authorId: userId
    };

    presenter
        .createComment(commentData)
        .then((result: ServiceResponse) => res.status(result.httpStatusCode).json(result.data))
        .catch((err: Error) => {
            logger.error(`Create comment error. ${err.message}`);
            next(err);
        });
};

export default {
    createComment,
};