import { Router } from 'express';
import userAuthRoute from './user_auth_route';
import userMeRoute from './user_me_route';
import postsRoute from './posts_route';
import commentsRoute from './comments_route';

const router = Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: userAuthRoute,
    },
    {
        path: '/user/me',
        route: userMeRoute,
    },
    {
        path: '/posts',
        route: postsRoute,
    },
    {
        path: '/comments',
        route: commentsRoute,
    },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

export default router;
