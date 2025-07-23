import { Router } from 'express';
import auth from '@middlewares/auth/authenticate';
import ctrlComments from '@controllers/client/comments_controller';

const router = Router();

// Protected routes (require authentication)
router.post('/', auth('jwt-user'), ctrlComments.createComment);

export default router;