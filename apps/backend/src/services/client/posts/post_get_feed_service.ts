import httpMsg from '@utils/http_messages/http_msg';
import getAllPosts from '@dao/posts/post_get_all_dao';
import { GetFeedOptions } from '@utils/types/posts';

export default async (options: GetFeedOptions = {}) => {
    try {
        const {
            userId,
            limit = 20,
            offset = 0,
            communityId
        } = options;

        // Get posts for feed - only public posts or user's own posts
        // TODO: Future implementation - integrate recommendation algorithm here
        // For personalized feeds, use: import recommendationService from '@services/client/recommendations';
        // const recommendedPosts = await recommendationService.getRecommendations({ userId, limit, offset });
        
        const result = await getAllPosts({
            communityId,
            isPublic: true,
            userId, // Pass userId to check for liked posts
            limit,
            offset,
            orderBy: 'createdAt', // TODO: Replace with recommendation score ordering
            orderDirection: 'desc'
        });
        
        if (!result.success) {
            return httpMsg.http422(result.error || 'Failed to get posts', 'GET_POSTS_ERROR');
        }

        // Transform posts to include engagement metrics
        const transformedPosts = result.data ? result.data.map((post: any) => ({
            id: post.id,
            content: post.content,
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            verseReference: post.verseReference,
            verseText: post.verseText,
            isPublic: post.isPublic,
            isPinned: post.isPinned,
            authorId: post.authorId,
            communityId: post.communityId,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: {
                id: post.author.id,
                name: post.author.name,
                firstName: post.author.firstName,
                lastName: post.author.lastName,
                username: post.author.username,
                profileImageUrl: post.author.profileImageUrl,
                denomination: post.author.denomination,
                isVerified: post.author.isVerified,
            },
            community: post.community,
            stats: {
                likesCount: post._count.likes,
                commentsCount: post._count.comments,
                sharesCount: post._count.shares,
            },
            isLiked: post.isLiked || false,
        })) : [];

        return httpMsg.http200({
            posts: transformedPosts,
            pagination: {
                limit,
                offset,
                hasMore: transformedPosts.length === limit
            }
        });
    } catch (error: any) {
        return httpMsg.http500(error.message || 'Internal server error', 'SERVER_ERROR');
    }
};