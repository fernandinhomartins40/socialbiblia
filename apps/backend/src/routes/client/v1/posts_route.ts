import { Router } from 'express';

import auth from '../../../middlewares/auth/authenticate';
import ctrlPosts from '../../../controllers/client/posts_controller';

const router = Router();

// Public routes - posts listing and viewing
router.get('/', ctrlPosts.getAllPosts);
router.get('/:id', ctrlPosts.getPostById);

// Protected routes - require authentication
router.post('/', auth('jwt-user'), ctrlPosts.createPost);
router.put('/:id', auth('jwt-user'), ctrlPosts.updatePost);
router.delete('/:id', auth('jwt-user'), ctrlPosts.deletePost);

export default router;