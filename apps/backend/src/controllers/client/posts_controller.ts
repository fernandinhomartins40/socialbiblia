import { Request, Response, NextFunction } from 'express';
import { PostsService } from '../../modules/posts/posts.service';
import { ResponseUtil } from '../../utils/responses';
import { AuthenticatedRequest } from '../../types/auth';
import logger from '../../utils/logger/winston/logger';

const getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;
        const result = await PostsService.getAllPosts(
            Number(page),
            Number(limit),
            filters
        );
        
        const response = ResponseUtil.paginated(result.posts, Number(page), Number(limit), result.total);
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao buscar posts. ${err.message}`);
        next(err);
    }
};

const getPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const post = await PostsService.getPostById(id!);
        const response = ResponseUtil.success(post);
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao buscar post. ${err.message}`);
        next(err);
    }
};

const createPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authorId = req.user!.userId;
        const post = await PostsService.createPost(req.body, authorId);
        const response = ResponseUtil.success(post, 'Post criado com sucesso');
        res.status(201).json(response);
    } catch (err: any) {
        logger.error(`Erro ao criar post. ${err.message}`);
        next(err);
    }
};

const updatePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const post = await PostsService.updatePost(id!, req.body, userId, userRole);
        const response = ResponseUtil.success(post, 'Post atualizado com sucesso');
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao atualizar post. ${err.message}`);
        next(err);
    }
};

const deletePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const result = await PostsService.deletePost(id!, userId, userRole);
        const response = ResponseUtil.success(result, 'Post deletado com sucesso');
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao deletar post. ${err.message}`);
        next(err);
    }
};

export default {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
};