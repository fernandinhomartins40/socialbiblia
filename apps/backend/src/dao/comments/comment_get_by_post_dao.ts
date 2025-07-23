import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

export default async (postId: string, userId?: string) => {
    try {
        const comments = await prisma.comment.findMany({
            where: {
                postId,
                parentId: null, // Only get top-level comments
            },
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
                        },
                        likes: userId ? {
                            where: { userId },
                            select: { id: true }
                        } : false,
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                _count: {
                    select: {
                        replies: true,
                        likes: true,
                    }
                },
                likes: userId ? {
                    where: { userId },
                    select: { id: true }
                } : false,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform to include isLiked flag
        const transformedComments = comments.map(comment => ({
            ...comment,
            isLiked: comment.likes && comment.likes.length > 0,
            likes: undefined,
            replies: comment.replies.map(reply => ({
                ...reply,
                isLiked: reply.likes && reply.likes.length > 0,
                likes: undefined,
            }))
        }));

        return { success: true, data: transformedComments };
    } catch (error: any) {
        logger.error(`Get comments by post DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};