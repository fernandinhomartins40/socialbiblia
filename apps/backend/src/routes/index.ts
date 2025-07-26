import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { postsRouter } from '../modules/posts/posts.routes';
import { productsRouter } from '../modules/products/products.routes';
import { healthRouter } from '../modules/health/health.routes';

const routes = Router();

// API routes
routes.use('/auth', authRouter);
routes.use('/users', usersRouter);
routes.use('/posts', postsRouter);
routes.use('/products', productsRouter);
routes.use('/health', healthRouter);

export { routes };
