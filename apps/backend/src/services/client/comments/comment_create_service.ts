import httpMsg from '@utils/http_messages/http_msg';
import createComment from '@dao/comments/comment_create_dao';
import { CreateCommentData } from '@utils/types/posts';

export default async (data: CreateCommentData) => {
    // Validate required fields
    if (!data.content || !data.postId || !data.authorId) {
        return httpMsg.http422('Content, postId and authorId are required', 'VALIDATION_ERROR');
    }

    // Validate content length
    if (data.content.length > 1000) {
        return httpMsg.http422('Comment is too long (max 1000 characters)', 'VALIDATION_ERROR');
    }

    try {
        const result = await createComment(data);
        
        if (!result.success) {
            return httpMsg.http422(result.error || 'Failed to create comment', 'CREATE_COMMENT_ERROR');
        }

        return httpMsg.http201(result.data);
    } catch (error: any) {
        return httpMsg.http500(error.message || 'Internal server error', 'SERVER_ERROR');
    }
};