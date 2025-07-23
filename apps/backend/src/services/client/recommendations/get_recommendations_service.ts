import httpMsg from '@utils/http_messages/http_msg';
import getRecommendedPosts from '@dao/recommendations/recommendations_get_dao';

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

        if (!userId) {
            return httpMsg.http422('User ID is required', 'VALIDATION_ERROR');
        }

        const result = await getRecommendedPosts({
            userId,
            limit,
            offset,
            minScore
        });
        
        if (!result.success) {
            return httpMsg.http422(result.error || 'Failed to get recommendations', 'GET_RECOMMENDATIONS_ERROR');
        }

        return httpMsg.http200({
            recommendations: result.data,
            pagination: {
                limit,
                offset,
                hasMore: result.data && result.data.length === limit
            }
        });
    } catch (error: any) {
        return httpMsg.http500(error.message || 'Internal server error', 'SERVER_ERROR');
    }
};