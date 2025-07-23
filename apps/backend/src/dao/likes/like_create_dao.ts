import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface CreateLikeData {
    userId: string;
    postId: string;
}

export default async (data: CreateLikeData) => {
    try {
        const like = await prisma.like.create({
            data: {
                userId: data.userId,
                postId: data.postId,
            },
            select: {
                id: true,
                userId: true,
                postId: true,
                createdAt: true,
            }
        });

        return { success: true, data: like };
    } catch (error: any) {
        // Handle unique constraint violation (user already liked the post)
        if (error.code === 'P2002') {
            return { success: false, data: null, error: 'Already liked' };
        }
        
        logger.error(`Create like DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};