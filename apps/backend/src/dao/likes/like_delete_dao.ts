import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

export default async (userId: string, postId: string) => {
    try {
        const like = await prisma.like.delete({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            },
            select: {
                id: true,
                userId: true,
                postId: true,
            }
        });

        return { success: true, data: like };
    } catch (error: any) {
        logger.error(`Delete like DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};