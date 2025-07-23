import { Request, Response, NextFunction } from 'express';
import presenter from '@services/client/posts';
import logger from '@utils/logger/winston/logger';

const createPost = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.id;
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'USER_NOT_AUTHENTICATED'
        });
    }

    const postData = {
        ...req.body,
        authorId: userId
    };

    presenter
        .createPost(postData)
        .then((result: any) => res.status(result.httpStatusCode).json(result.data))
        .catch((err: any) => {
            logger.error(`Create post error. ${err.message}`);
            next(err);
        });
};

const getFeed = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.id;
    const { limit, offset, communityId } = req.query;

    const options = {
        userId,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
        communityId: communityId as string,
    };

    presenter
        .getFeed(options)
        .then((result: any) => res.status(result.httpStatusCode).json(result.data))
        .catch((err: any) => {
            logger.error(`Get feed error. ${err.message}`);
            next(err);
        });
};

const likePost = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.id;
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'USER_NOT_AUTHENTICATED'
        });
    }

    const { postId, action } = req.body;

    presenter
        .likePost({
            userId,
            postId,
            action
        })
        .then((result: any) => res.status(result.httpStatusCode).json(result.data))
        .catch((err: any) => {
            logger.error(`Like post error. ${err.message}`);
            next(err);
        });
};

const deletePost = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.id;
    const { postId } = req.params;
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'USER_NOT_AUTHENTICATED'
        });
    }

    presenter
        .deletePost({ userId, postId })
        .then((result: any) => res.status(result.httpStatusCode).json(result.data))
        .catch((err: any) => {
            logger.error(`Delete post error. ${err.message}`);
            next(err);
        });
};

const getComments = (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const { limit, offset } = req.query;

    const options = {
        postId,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
    };

    presenter
        .getComments(options)
        .then((result: any) => res.status(result.httpStatusCode).json(result.data))
        .catch((err: any) => {
            logger.error(`Get comments error. ${err.message}`);
            next(err);
        });
};

const createComment = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.id;
    const { postId } = req.params;
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'USER_NOT_AUTHENTICATED'
        });
    }

    const commentData = {
        ...req.body,
        authorId: userId,
        postId
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
    createPost,
    getFeed,
    likePost,
    deletePost,
    getComments,
    createComment,
};