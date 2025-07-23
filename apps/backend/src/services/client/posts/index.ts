import createPost from './post_create_service';
import getFeed from './post_get_feed_service';
import likePost from './post_like_service';
import deletePost from './post_delete_service';
import getComments from './post_get_comments_service';
import createComment from './post_create_comment_service';

export default {
    createPost,
    getFeed,
    likePost,
    deletePost,
    getComments,
    createComment,
};