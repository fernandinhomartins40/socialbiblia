import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface CreateInteractionData {
    userId: string;
    postId?: string;
    commentId?: string;
    interactionType: string;
    duration?: number;
}

export default async (data: CreateInteractionData) => {
    try {
        const interaction = await prisma.userInteraction.create({
            data: {
                userId: data.userId,
                postId: data.postId,
                commentId: data.commentId,
                interactionType: data.interactionType,
                duration: data.duration,
            },
        });

        return { success: true, data: interaction };
    } catch (error: any) {
        logger.error(`Create interaction DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};