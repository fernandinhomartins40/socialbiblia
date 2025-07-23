import { Router } from 'express';
import auth from '@middlewares/auth/authenticate';
import ctrlPosts from '@controllers/client/posts_controller';

const router = Router();

// Get feed (public posts)
router.get('/feed', ctrlPosts.getFeed);

// Protected routes (require authentication)
router.post('/', auth('jwt-user'), ctrlPosts.createPost);
router.post('/like', auth('jwt-user'), ctrlPosts.likePost);
router.delete('/:postId', auth('jwt-user'), ctrlPosts.deletePost);

// Comments routes
router.get('/:postId/comments', ctrlPosts.getComments);
router.post('/:postId/comments', auth('jwt-user'), ctrlPosts.createComment);

export default router;