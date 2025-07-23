import httpMsg from '@utils/http_messages/http_msg';
import getComments from '@dao/comments/comment_get_all_dao';

interface GetCommentsOptions {
    postId: string;
    limit?: number;
    offset?: number;
}

export default async (options: GetCommentsOptions = { postId: '' }) => {
    try {
        const {
            postId,
            limit = 20,
            offset = 0
        } = options;

        if (!postId) {
            return httpMsg.http422('Post ID is required', 'VALIDATION_ERROR');
        }

        const result = await getComments({
            postId,
            limit,
            offset,
            orderBy: 'createdAt',
            orderDirection: 'asc'
        });
        
        if (!result.success) {
            return httpMsg.http422(result.error || 'Failed to get comments', 'GET_COMMENTS_ERROR');
        }

        return httpMsg.http200({
            comments: result.data,
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