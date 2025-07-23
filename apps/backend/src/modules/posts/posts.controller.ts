import { Request, Response } from 'express';
import { PostsService } from './posts.service';
import { ResponseUtil } from '../../utils/responses';
import { AuthenticatedRequest } from '../../types/auth';

export class PostsController {
  static async getAllPosts(req: Request, res: Response) {
    const { page = 1, limit = 10, ...filters } = req.query;
    const result = await PostsService.getAllPosts(
      Number(page),
      Number(limit),
      filters
    );
    
    res.json(
      ResponseUtil.paginated(result.posts, Number(page), Number(limit), result.total)
    );
  }

  static async getPostById(req: Request, res: Response) {
    const { id } = req.params;
    const post = await PostsService.getPostById(id!);
    res.json(ResponseUtil.success(post));
  }

  static async createPost(req: AuthenticatedRequest, res: Response) {
    const authorId = req.user!.userId;
    const post = await PostsService.createPost(req.body, authorId);
    res.status(201).json(ResponseUtil.success(post, 'Post criado com sucesso'));
  }

  static async updatePost(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const post = await PostsService.updatePost(id!, req.body, userId, userRole);
    res.json(ResponseUtil.success(post, 'Post atualizado com sucesso'));
  }

  static async deletePost(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const result = await PostsService.deletePost(id!, userId, userRole);
    res.json(ResponseUtil.success(result, 'Post deletado com sucesso'));
  }
}
