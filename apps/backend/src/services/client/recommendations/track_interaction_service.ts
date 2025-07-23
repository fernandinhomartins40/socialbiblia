import httpMsg from '@utils/http_messages/http_msg';
import createInteraction from '@dao/interactions/interaction_create_dao';

interface TrackInteractionData {
    userId: string;
    postId?: string;
    commentId?: string;
    interactionType: 'like' | 'comment' | 'share' | 'view' | 'bookmark';
    duration?: number;
}

export default async (data: TrackInteractionData) => {
    try {
        // Validate required fields
        if (!data.userId || !data.interactionType) {
            return httpMsg.http422('User ID and interaction type are required', 'VALIDATION_ERROR');
        }

        if (!data.postId && !data.commentId) {
            return httpMsg.http422('Either postId or commentId is required', 'VALIDATION_ERROR');
        }

        const result = await createInteraction(data);
        
        if (!result.success) {
            return httpMsg.http422(result.error || 'Failed to track interaction', 'TRACK_INTERACTION_ERROR');
        }

        return httpMsg.http201(result.data);
    } catch (error: any) {
        return httpMsg.http500(error.message || 'Internal server error', 'SERVER_ERROR');
    }
};