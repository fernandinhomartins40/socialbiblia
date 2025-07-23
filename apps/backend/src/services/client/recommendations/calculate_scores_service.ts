import httpMsg from '@utils/http_messages/http_msg';
import calculateScores from '@dao/recommendations/calculate_scores_dao';

interface CalculateScoresOptions {
    userId?: string; // If not provided, calculate for all users
    postId?: string; // If not provided, calculate for all posts
}

export default async (options: CalculateScoresOptions = {}) => {
    try {
        const result = await calculateScores(options);
        
        if (!result.success) {
            return httpMsg.http422(result.error || 'Failed to calculate scores', 'CALCULATE_SCORES_ERROR');
        }

        return httpMsg.http200({
            message: 'Recommendation scores calculated successfully',
            processed: result.data?.processed || 0
        });
    } catch (error: any) {
        return httpMsg.http500(error.message || 'Internal server error', 'SERVER_ERROR');
    }
};