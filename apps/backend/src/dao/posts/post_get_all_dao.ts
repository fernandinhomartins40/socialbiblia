import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface GetPostsOptions {
    userId?: string;
    communityId?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt';
    orderDirection?: 'asc' | 'desc';
}

export default async (options: GetPostsOptions = {}) => {
    try {
        const {
            userId,
            communityId,
            isPublic = true,
            limit = 20,
            offset = 0,
            orderBy = 'createdAt',
            orderDirection = 'desc'
        } = options;

        const where: any = {};

        if (communityId) {
            where.communityId = communityId;
        }

        // Security: Only allow public posts or user's own posts
        if (isPublic !== undefined) {
            if (userId) {
                // Show public posts or user's own posts (regardless of privacy)
                where.OR = [
                    { isPublic: true },
                    { authorId: userId }
                ];
            } else {
                // If no user, only show public posts
                where.isPublic = isPublic;
            }
        } else if (userId) {
            // If filtering by specific user, show only their posts
            where.authorId = userId;
        }

        const posts = await prisma.post.findMany({
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
                community: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true,
                    }
                },
                likes: userId ? {
                    where: { userId },
                    select: { id: true }
                } : false,
            },
            orderBy: {
                [orderBy]: orderDirection
            },
            take: limit,
            skip: offset,
        });

        // Transform to include isLiked flag
        const transformedPosts = posts.map((post: any) => ({
            ...post,
            isLiked: post.likes && post.likes.length > 0,
            likes: undefined, // Remove the likes array, we only needed it for the isLiked flag
        }));

        return { success: true, data: transformedPosts };
    } catch (error: any) {
        logger.error(`Get posts DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};