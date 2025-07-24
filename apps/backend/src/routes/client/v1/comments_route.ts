import { Router } from 'express';

import auth from '@middlewares/auth/authenticate';
import ctrlComments from '@controllers/client/comments_controller';

const router = Router();

// Public routes - comments listing and viewing
router.get('/', ctrlComments.getAllComments);
router.get('/:id', ctrlComments.getCommentById);
router.get('/post/:postId', ctrlComments.getCommentsByPost);

// Protected routes - require authentication
router.post('/', auth('jwt-user'), ctrlComments.createComment);
router.put('/:id', auth('jwt-user'), ctrlComments.updateComment);
router.delete('/:id', auth('jwt-user'), ctrlComments.deleteComment);
router.patch('/:id/approve', auth('jwt-user'), ctrlComments.approveComment);

export default router;