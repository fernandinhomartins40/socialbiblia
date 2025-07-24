import { Router } from 'express';
import healthController from '../../../controllers/commons/health/health.controller';

const router = Router();

// Comprehensive health check
router.get('/', healthController.check);

// Quick health check for load balancers
router.get('/quick', healthController.quickCheck);

// Individual service health checks
router.get('/redis', healthController.redisHealth);
router.get('/database', healthController.databaseHealth);

export default router; 