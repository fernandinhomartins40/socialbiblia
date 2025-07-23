import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface GetCommentsOptions {
    postId?: string;
    parentId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt';
    orderDirection?: 'asc' | 'desc';
}

export default async (options: GetCommentsOptions = {}) => {
    try {
        const {
            postId,
            parentId,
            limit = 20,
            offset = 0,
            orderBy = 'createdAt',
            orderDirection = 'asc'
        } = options;

        const where: any = {};

        if (postId) {
            where.postId = postId;
        }

        if (parentId !== undefined) {
            where.parentId = parentId;
        }

        const comments = await prisma.comment.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        profileImageUrl: true,
                        denomination: true,
                        isVerified: true,
                    }
                },
                _count: {
                    select: {
                        replies: true,
                        likes: true,
                    }
                },
                replies: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                firstName: true,
                                lastName: true,
                                username: true,
                                profileImageUrl: true,
                                denomination: true,
                                isVerified: true,
                            }
                        },
                        _count: {
                            select: {
                                likes: true,
                            }
                        }
                    },
                    orderBy: {
                        [orderBy]: orderDirection
                    },
                    take: 3 // Limit nested replies to avoid deep nesting
                }
            },
            orderBy: {
                [orderBy]: orderDirection
            },
            take: limit,
            skip: offset,
        });

        return { success: true, data: comments };
    } catch (error: any) {
        logger.error(`Get comments DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};