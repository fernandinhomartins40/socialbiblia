import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

interface CalculateScoresOptions {
    userId?: string;
    postId?: string;
}

export default async (options: CalculateScoresOptions = {}) => {
    try {
        const { userId, postId } = options;
        let processed = 0;

        // Get users to calculate scores for
        const users = userId 
            ? [{ id: userId }]
            : await prisma.user.findMany({ select: { id: true } });

        for (const user of users) {
            // Get user's interaction patterns
            const userInteractions = await prisma.userInteraction.findMany({
                where: {
                    userId: user.id,
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                },
                include: {
                    post: {
                        include: {
                            author: { select: { denomination: true } },
                            tags: { include: { tag: true } }
                        }
                    }
                }
            });

            // Get posts to calculate scores for
            const posts = postId 
                ? [{ id: postId }]
                : await prisma.post.findMany({
                    where: {
                        isPublic: true,
                        authorId: { not: user.id } // Don't recommend user's own posts
                    },
                    select: { id: true },
                    take: 100 // Limit for performance
                });

            for (const post of posts) {
                const score = await calculatePostScore(user.id, post.id, userInteractions);
                
                // Upsert recommendation score
                await prisma.recommendationScore.upsert({
                    where: {
                        userId_postId: {
                            userId: user.id,
                            postId: post.id
                        }
                    },
                    update: {
                        score: score.value,
                        factors: score.factors
                    },
                    create: {
                        userId: user.id,
                        postId: post.id,
                        score: score.value,
                        factors: score.factors
                    }
                });

                processed++;
            }
        }

        return { success: true, data: { processed } };
    } catch (error: any) {
        logger.error(`Calculate scores DAO error: ${error.message}`);
        return { success: false, data: null, error: error.message };
    }
};

async function calculatePostScore(userId: string, postId: string, userInteractions: any[]): Promise<{ value: number; factors: any }> {
    try {
        // Basic recommendation algorithm
        let score = 0.5; // Base score
        const factors: any = {};

        // Get post details
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: { select: { denomination: true } },
                tags: { include: { tag: true } },
                _count: { select: { likes: true, comments: true } }
            }
        });

        if (!post) return { value: 0, factors: {} };

        // Factor 1: Denomination similarity (weight: 0.3)
        const userDenomination = await prisma.user.findUnique({
            where: { id: userId },
            select: { denomination: true }
        });

        if (userDenomination?.denomination === post.author.denomination) {
            score += 0.3;
            factors.denominationMatch = true;
        }

        // Factor 2: Interaction patterns (weight: 0.4)
        const userLikedPostTypes = userInteractions
            .filter(int => int.interactionType === 'like' && int.post)
            .map(int => int.post);

        if (userLikedPostTypes.some(p => p.verseReference && post.verseReference)) {
            score += 0.2; // User likes verse posts
            factors.versePreference = true;
        }

        // Factor 3: Post engagement (weight: 0.3)
        const engagementScore = Math.min(
            (post._count.likes * 0.1 + post._count.comments * 0.2) / 10,
            0.3
        );
        score += engagementScore;
        factors.engagementScore = engagementScore;

        // Factor 4: Recency boost
        const daysSinceCreated = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated < 7) {
            score += 0.1; // Boost recent posts
            factors.recentPost = true;
        }

        // Normalize score to 0-1 range
        score = Math.min(Math.max(score, 0), 1);

        return { value: score, factors };
    } catch (error) {
        logger.error(`Error calculating post score: ${error}`);
        return { value: 0.5, factors: {} };
    }
}