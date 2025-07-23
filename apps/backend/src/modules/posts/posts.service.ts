import { prisma } from '../../core/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { generateSlug } from '../../utils/helpers';
import { CreatePostDto, UpdatePostDto, PostFilters, PostResponse } from '../../types/posts';

export class PostsService {
  static async getAllPosts(page: number = 1, limit: number = 10, filters: PostFilters = {}): Promise<{ posts: PostResponse[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const where = {
      deletedAt: null,
      ...(filters.status && { status: filters.status }),
      ...(filters.category && { category: filters.category }),
      ...(filters.featured !== undefined && { featured: filters.featured }),
      ...(filters.authorId && { authorId: filters.authorId }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' as const } },
          { content: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    return { posts, total };
  }

  static async getPostById(id: string) {
    const post = await prisma.post.findUnique({
      where: { id, deletedAt: null },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundError('Post');
    }

    return post;
  }

  static async createPost(data: CreatePostDto, authorId: string): Promise<PostResponse> {
    const slug = generateSlug(data.title);
    
    // Verificar se o slug já existe
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    });

    if (existingPost) {
      throw new Error('Slug já existe');
    }

    const post = await prisma.post.create({
      data: {
        ...data,
        slug,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return post;
  }

  static async updatePost(id: string, data: UpdatePostDto, userId: string, userRole: string): Promise<PostResponse> {
    const post = await prisma.post.findUnique({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundError('Post');
    }

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Você só pode editar seus próprios posts');
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return updatedPost;
  }

  static async deletePost(id: string, userId: string, userRole: string) {
    const post = await prisma.post.findUnique({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundError('Post');
    }

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Você só pode deletar seus próprios posts');
    }

    await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Post deletado com sucesso' };
  }
}
