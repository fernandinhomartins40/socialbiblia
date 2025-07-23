import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { ResponseUtil } from '../../utils/responses';
import { AuthenticatedRequest } from '../../types/auth';

export class UsersController {
  static async getAllUsers(req: Request, res: Response) {
    const { page = 1, limit = 10, search } = req.query;
    const result = await UsersService.getAllUsers(
      Number(page),
      Number(limit),
      search as string
    );
    
    res.json(
      ResponseUtil.paginated(result.users, Number(page), Number(limit), result.total)
    );
  }

  static async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await UsersService.getUserById(id!);
    res.json(ResponseUtil.success(user));
  }

  static async updateUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const user = await UsersService.updateUser(id!, userId, req.body);
    res.json(ResponseUtil.success(user, 'Usuário atualizado com sucesso'));
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const result = await UsersService.deleteUser(id!, userId, userRole);
    res.json(ResponseUtil.success(result, 'Usuário deletado com sucesso'));
  }
}
