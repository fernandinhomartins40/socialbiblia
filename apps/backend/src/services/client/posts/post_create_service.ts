import constError from '@constants/error_constant';
import httpMsg from '@utils/http_messages/http_msg';
import createPost from '@dao/posts/post_create_dao';
import { CreatePostData } from '@utils/types/posts';

export default async (data: CreatePostData) => {
    // Validate required fields
    if (!data.content || !data.authorId) {
        return httpMsg.http422('Content and authorId are required', 'VALIDATION_ERROR');
    }

    // Validate content length
    if (data.content.length > 5000) {
        return httpMsg.http422('Content is too long (max 5000 characters)', 'VALIDATION_ERROR');
    }

    try {
        const result = await createPost(data);
        
        if (!result.success) {
            return httpMsg.http422(result.error || 'Failed to create post', 'CREATE_POST_ERROR');
        }

        return httpMsg.http201(result.data);
    } catch (error: any) {
        return httpMsg.http500(error.message || 'Internal server error', 'SERVER_ERROR');
    }
};