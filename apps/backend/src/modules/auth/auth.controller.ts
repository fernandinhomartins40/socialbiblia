import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ResponseUtil } from '../../utils/responses';
import { AuthenticatedRequest } from '../../types/auth';
import { NotFoundError } from '../../utils/errors';
import { prisma } from '../../core/database';

export class AuthController {
  static async register(req: Request, res: Response) {
    const result = await AuthService.register(req.body);
    res.status(201).json(
      ResponseUtil.success(result, 'Usuário registrado com sucesso')
    );
  }

  static async login(req: Request, res: Response) {
    const result = await AuthService.login(req.body);
    res.json(
      ResponseUtil.success(result, 'Login realizado com sucesso')
    );
  }

  static async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refreshToken(refreshToken);
    res.json(
      ResponseUtil.success(tokens, 'Token atualizado com sucesso')
    );
  }

  static async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);
    res.json(
      ResponseUtil.success(null, 'Logout realizado com sucesso')
    );
  }

  static async logoutAll(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.userId;
    await AuthService.logoutAll(userId);
    res.json(
      ResponseUtil.success(null, 'Logout de todos os dispositivos realizado com sucesso')
    );
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário');
    }

    res.json(
      ResponseUtil.success(user, 'Dados do usuário recuperados com sucesso')
    );
  }
}
