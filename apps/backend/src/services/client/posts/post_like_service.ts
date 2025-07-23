import httpMsg from '@utils/http_messages/http_msg';
import createLike from '@dao/likes/like_create_dao';
import deleteLike from '@dao/likes/like_delete_dao';
import getPost from '@dao/posts/post_get_one_dao';

interface LikePostData {
    userId: string;
    postId: string;
    action: 'like' | 'unlike';
}

export default async (data: LikePostData) => {
    // Validate required fields
    if (!data.userId || !data.postId || !data.action) {
        return httpMsg.http422('userId, postId and action are required', 'VALIDATION_ERROR');
    }

    // Validate action
    if (!['like', 'unlike'].includes(data.action)) {
        return httpMsg.http422('Action must be "like" or "unlike"', 'VALIDATION_ERROR');
    }

    try {
        // Check if post exists and is accessible
        const postResult = await getPost({ id: data.postId });
        if (!postResult.success) {
            return httpMsg.http404('Post not found', 'POST_NOT_FOUND');
        }

        const post = postResult.data;
        
        // Check if user can interact with this post
        if (!post.isPublic && post.authorId !== data.userId) {
            return httpMsg.http403('You cannot interact with this private post', 'ACCESS_DENIED');
        }

        let result;
        
        if (data.action === 'like') {
            result = await createLike({
                userId: data.userId,
                postId: data.postId
            });
            
            if (!result.success) {
                if (result.error === 'Already liked') {
                    return httpMsg.http422('Post already liked', 'ALREADY_LIKED');
                }
                return httpMsg.http422(result.error || 'Failed to like post', 'LIKE_ERROR');
            }
        } else {
            result = await deleteLike(data.userId, data.postId);
            
            if (!result.success) {
                return httpMsg.http422(result.error || 'Failed to unlike post', 'UNLIKE_ERROR');
            }
        }

        return httpMsg.http200({
            success: true,
            action: data.action,
            postId: data.postId,
            userId: data.userId
        });
        
    } catch (error: any) {
        return httpMsg.http500(error.message || 'Internal server error', 'SERVER_ERROR');
    }
};