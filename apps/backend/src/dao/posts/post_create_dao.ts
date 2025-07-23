import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface CreatePostData {
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    verseReference?: string;
    verseText?: string;
    isPublic?: boolean;
    authorId: string;
    communityId?: string;
}

export default async (data: CreatePostData, select: object = {}) => {
    try {
        const post = await prisma.post.create({
            data: {
                content: data.content,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                verseReference: data.verseReference,
                verseText: data.verseText,
                isPublic: data.isPublic ?? true,
                authorId: data.authorId,
                communityId: data.communityId,
            },
            select: Object.keys(select).length > 0 ? select : {
                id: true,
                content: true,
                imageUrl: true,
                videoUrl: true,
                verseReference: true,
                verseText: true,
                isPublic: true,
                authorId: true,
                communityId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return { success: true, data: post };
    } catch (error: any) {
        logger.error(`Create post DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};