import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface DeletePostData {
    userId: string;
    postId: string;
}

export default async (data: DeletePostData) => {
    try {
        // First, check if the post exists and belongs to the user
        const post = await prisma.post.findUnique({
            where: { id: data.postId },
            select: { id: true, authorId: true }
        });

        if (!post) {
            return { success: false, error: 'POST_NOT_FOUND' };
        }

        // Check if the user is the author of the post
        if (post.authorId !== data.userId) {
            return { success: false, error: 'UNAUTHORIZED' };
        }

        // Delete the post (CASCADE will handle related records)
        await prisma.post.delete({
            where: { id: data.postId }
        });

        return { success: true, data: { message: 'Post deleted successfully' } };
    } catch (error: any) {
        logger.error(`Delete post DAO error: ${error.message}`);
        return { success: false, error: error.message };
    }
};