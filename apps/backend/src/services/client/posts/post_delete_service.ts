import httpMsg from '@utils/http_messages/http_msg';
import deletePost from '@dao/posts/post_delete_dao';
import { DeletePostData } from '@utils/types/posts';

export default async (data: DeletePostData) => {
    // Validate required fields
    if (!data.userId || !data.postId) {
        return httpMsg.http422('User ID and Post ID are required', 'VALIDATION_ERROR');
    }

    try {
        const result = await deletePost(data);
        
        if (!result.success) {
            if (result.error === 'POST_NOT_FOUND') {
                return httpMsg.http404('Post not found', 'POST_NOT_FOUND');
            }
            if (result.error === 'UNAUTHORIZED') {
                return httpMsg.http403('You can only delete your own posts', 'UNAUTHORIZED');
            }
            return httpMsg.http422(result.error || 'Failed to delete post', 'DELETE_POST_ERROR');
        }

        return httpMsg.http200({ message: 'Post deleted successfully' });
    } catch (error: any) {
        return httpMsg.http500(error.message || 'Internal server error', 'SERVER_ERROR');
    }
};