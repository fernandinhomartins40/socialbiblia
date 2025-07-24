import { prisma } from '../../core/database';
import { Comment, CreateCommentData, UpdateCommentData, CommentFilters } from '../../types/comments';
import { Logger } from '../../utils/logger';

export class CommentsService {
  static async getAllComments(
    page: number = 1,
    limit: number = 10,
    filters: CommentFilters = {}
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (filters.postId) {
        where.postId = filters.postId;
      }

      if (filters.authorId) {
        where.authorId = filters.authorId;
      }

      if (filters.parentId !== undefined) {
        where.parentId = filters.parentId;
      }

      if (filters.isApproved !== undefined) {
        where.isApproved = filters.isApproved;
      }

      if (filters.search) {
        where.content = {
          contains: filters.search,
          mode: 'insensitive'
        };
      }

      where.deletedAt = null;

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          skip,
          take: limit,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            post: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            },
            replies: {
              where: { deletedAt: null },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.comment.count({ where })
      ]);

      Logger.info('Comments fetched successfully', {
        page,
        limit,
        total,
        filters
      });

      return { comments, total };
    } catch (error) {
      Logger.error('Error fetching comments:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  static async getCommentById(id: string) {
    try {
      const comment = await prisma.comment.findFirst({
        where: {
          id,
          deletedAt: null
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          replies: {
            where: { deletedAt: null },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      Logger.info('Comment fetched successfully', { commentId: id });
      return comment;
    } catch (error) {
      Logger.error('Error fetching comment:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  static async createComment(data: CreateCommentData, authorId: string) {
    try {
      // Verificar se o post existe
      const post = await prisma.post.findFirst({
        where: {
          id: data.postId,
          deletedAt: null
        }
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Verificar se o comentário pai existe (se fornecido)
      if (data.parentId) {
        const parentComment = await prisma.comment.findFirst({
          where: {
            id: data.parentId,
            deletedAt: null
          }
        });

        if (!parentComment) {
          throw new Error('Parent comment not found');
        }
      }

      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          postId: data.postId,
          authorId,
          parentId: data.parentId || null,
          isApproved: false // Por padrão, comentários precisam ser aprovados
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      });

      Logger.info('Comment created successfully', { commentId: comment.id, authorId });
      return comment;
    } catch (error) {
      Logger.error('Error creating comment:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  static async updateComment(id: string, data: UpdateCommentData, userId: string, userRole: string) {
    try {
      const existingComment = await prisma.comment.findFirst({
        where: {
          id,
          deletedAt: null
        }
      });

      if (!existingComment) {
        throw new Error('Comment not found');
      }

      // Verificar permissões: apenas o autor ou admin pode atualizar
      if (existingComment.authorId !== userId && userRole !== 'ADMIN') {
        throw new Error('Unauthorized to update this comment');
      }

      const comment = await prisma.comment.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      });

      Logger.info('Comment updated successfully', { commentId: id, userId });
      return comment;
    } catch (error) {
      Logger.error('Error updating comment:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  static async deleteComment(id: string, userId: string, userRole: string) {
    try {
      const existingComment = await prisma.comment.findFirst({
        where: {
          id,
          deletedAt: null
        }
      });

      if (!existingComment) {
        throw new Error('Comment not found');
      }

      // Verificar permissões: apenas o autor ou admin pode deletar
      if (existingComment.authorId !== userId && userRole !== 'ADMIN') {
        throw new Error('Unauthorized to delete this comment');
      }

      // Soft delete
      await prisma.comment.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });

      Logger.info('Comment deleted successfully', { commentId: id, userId });
      return { message: 'Comment deleted successfully' };
    } catch (error) {
      Logger.error('Error deleting comment:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  static async approveComment(id: string, userId: string) {
    try {
      const comment = await prisma.comment.update({
        where: {
          id,
          deletedAt: null
        },
        data: {
          isApproved: true,
          updatedAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      });

      Logger.info('Comment approved successfully', { commentId: id, userId });
      return comment;
    } catch (error) {
      Logger.error('Error approving comment:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  static async getCommentsByPost(postId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            postId,
            parentId: null, // Apenas comentários de nível superior
            isApproved: true,
            deletedAt: null
          },
          skip,
          take: limit,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            replies: {
              where: {
                isApproved: true,
                deletedAt: null
              },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.comment.count({
          where: {
            postId,
            parentId: null,
            isApproved: true,
            deletedAt: null
          }
        })
      ]);

      Logger.info('Comments by post fetched successfully', { postId, page, limit, total });
      return { comments, total };
    } catch (error) {
      Logger.error('Error fetching comments by post:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}