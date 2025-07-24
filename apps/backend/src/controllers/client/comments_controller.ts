import { Request, Response, NextFunction } from 'express';
import { CommentsService } from '../../modules/comments/comments.service';
import { ResponseUtil } from '../../utils/responses';
import { AuthenticatedRequest } from '../../types/auth';
import logger from '@utils/logger/winston/logger';

const getAllComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;
        const result = await CommentsService.getAllComments(
            Number(page),
            Number(limit),
            filters
        );
        
        const response = ResponseUtil.paginated(result.comments, Number(page), Number(limit), result.total);
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao buscar comentários. ${err.message}`);
        next(err);
    }
};

const getCommentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const comment = await CommentsService.getCommentById(id!);
        const response = ResponseUtil.success(comment);
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao buscar comentário. ${err.message}`);
        next(err);
    }
};

const getCommentsByPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const result = await CommentsService.getCommentsByPost(
            postId!,
            Number(page),
            Number(limit)
        );
        
        const response = ResponseUtil.paginated(result.comments, Number(page), Number(limit), result.total);
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao buscar comentários do post. ${err.message}`);
        next(err);
    }
};

const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authorId = req.user!.userId;
        const comment = await CommentsService.createComment(req.body, authorId);
        const response = ResponseUtil.success(comment, 'Comentário criado com sucesso');
        res.status(201).json(response);
    } catch (err: any) {
        logger.error(`Erro ao criar comentário. ${err.message}`);
        next(err);
    }
};

const updateComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const comment = await CommentsService.updateComment(id!, req.body, userId, userRole);
        const response = ResponseUtil.success(comment, 'Comentário atualizado com sucesso');
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao atualizar comentário. ${err.message}`);
        next(err);
    }
};

const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const result = await CommentsService.deleteComment(id!, userId, userRole);
        const response = ResponseUtil.success(result, 'Comentário deletado com sucesso');
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao deletar comentário. ${err.message}`);
        next(err);
    }
};

const approveComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const comment = await CommentsService.approveComment(id!, userId);
        const response = ResponseUtil.success(comment, 'Comentário aprovado com sucesso');
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(`Erro ao aprovar comentário. ${err.message}`);
        next(err);
    }
};

export default {
    getAllComments,
    getCommentById,
    getCommentsByPost,
    createComment,
    updateComment,
    deleteComment,
    approveComment,
};