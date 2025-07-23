import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface CreateCommentData {
    content: string;
    postId: string;
    authorId: string;
    parentId?: string;
}

export default async (data: CreateCommentData) => {
    try {
        const comment = await prisma.comment.create({
            data: {
                content: data.content,
                postId: data.postId,
                authorId: data.authorId,
                parentId: data.parentId,
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
                _count: {
                    select: {
                        replies: true,
                        likes: true,
                    }
                }
            }
        });

        return { success: true, data: comment };
    } catch (error: any) {
        logger.error(`Create comment DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};