import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface GetRecommendationsOptions {
    userId: string;
    limit?: number;
    offset?: number;
    minScore?: number;
}

export default async (options: GetRecommendationsOptions) => {
    try {
        const {
            userId,
            limit = 10,
            offset = 0,
            minScore = 0.5
        } = options;

        // Get recommended posts based on recommendation scores
        const recommendations = await prisma.recommendationScore.findMany({
            where: {
                userId,
                score: {
                    gte: minScore
                }
            },
            include: {
                post: {
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
                        likes: {
                            where: { userId },
                            select: { id: true }
                        }
                    }
                }
            },
            orderBy: {
                score: 'desc'
            },
            take: limit,
            skip: offset,
        });

        // Transform to include isLiked flag
        const transformedRecommendations = recommendations.map(rec => ({
            ...rec.post,
            isLiked: rec.post.likes && rec.post.likes.length > 0,
            likes: undefined, // Remove the likes array
            recommendationScore: rec.score,
            recommendationFactors: rec.factors,
        }));

        return { success: true, data: transformedRecommendations };
    } catch (error: any) {
        logger.error(`Get recommendations DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};