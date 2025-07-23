import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

export default async (where: object, select: object = {}) => {
    try {
        const post = await prisma.post.findFirst({
            where,
            select: Object.keys(select).length > 0 ? select : {
                id: true,
                content: true,
                imageUrl: true,
                videoUrl: true,
                verseReference: true,
                verseText: true,
                isPublic: true,
                isPinned: true,
                authorId: true,
                communityId: true,
                createdAt: true,
                updatedAt: true,
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
                }
            },
        });

        if (!post) {
            return { success: false, data: null, error: 'Post not found' };
        }

        return { success: true, data: post };
    } catch (error: any) {
        logger.error(`Get post DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};