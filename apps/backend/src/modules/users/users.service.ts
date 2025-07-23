import { prisma } from '../../core/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { UpdateUserDto, UserResponse } from '../../types/users';

export class UsersService {
  static async getAllUsers(page: number = 1, limit: number = 10, search?: string): Promise<{ users: UserResponse[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } },
      ],
      deletedAt: null,
    } : { deletedAt: null };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          lastLogin: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário');
    }

    return user;
  }

  static async updateUser(id: string, userId: string, data: UpdateUserDto): Promise<UserResponse> {
    if (id !== userId) {
      throw new ForbiddenError('Você só pode atualizar seu próprio perfil');
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return user;
  }

  static async deleteUser(id: string, requestingUserId: string, _requestingUserRole: string) {
    if (id === requestingUserId) {
      throw new ForbiddenError('Você não pode deletar seu próprio perfil');
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Usuário deletado com sucesso' };
  }
}
