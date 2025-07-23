import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface UpdatePostData {
    content?: string;
    imageUrl?: string;
    videoUrl?: string;
    verseReference?: string;
    verseText?: string;
    isPublic?: boolean;
    isPinned?: boolean;
}

export default async (id: string, data: UpdatePostData, select: object = {}) => {
    try {
        const post = await prisma.post.update({
            where: { id },
            data: {
                ...(data.content !== undefined && { content: data.content }),
                ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
                ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
                ...(data.verseReference !== undefined && { verseReference: data.verseReference }),
                ...(data.verseText !== undefined && { verseText: data.verseText }),
                ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
                ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
            },
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
            },
        });

        return { success: true, data: post };
    } catch (error: any) {
        logger.error(`Update post DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};