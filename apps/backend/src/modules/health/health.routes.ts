import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns the basic health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                   example: 3600
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *             example:
 *               status: "ok"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               uptime: 3600
 *               version: "1.0.0"
 *               environment: "development"
 *       500:
 *         description: API is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/', HealthController.getHealth);

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness check
 *     description: Returns detailed readiness status including database and external service connections
 *     responses:
 *       200:
 *         description: API is ready to serve requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "ok"
 *                         responseTime:
 *                           type: number
 *                           example: 25
 *                     cache:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "ok"
 *                         responseTime:
 *                           type: number
 *                           example: 10
 *             example:
 *               status: "ready"
 *               checks:
 *                 database:
 *                   status: "ok"
 *                   responseTime: 25
 *                 cache:
 *                   status: "ok"
 *                   responseTime: 10
 *       503:
 *         description: API is not ready (dependencies are down)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "not_ready"
 *                 checks:
 *                   type: object
 *                   description: Status of each dependency
 */
router.get('/ready', HealthController.getReady);

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     tags: [Health]
 *     summary: Application metrics
 *     description: Returns performance and usage metrics of the application
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                       description: Used memory in bytes
 *                     total:
 *                       type: number
 *                       description: Total memory in bytes
 *                     free:
 *                       type: number
 *                       description: Free memory in bytes
 *                 cpu:
 *                   type: object
 *                   properties:
 *                     usage:
 *                       type: number
 *                       description: CPU usage percentage
 *                 requests:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total number of requests
 *                     rate:
 *                       type: number
 *                       description: Requests per second
 *                 uptime:
 *                   type: number
 *                   description: Application uptime in seconds
 *             example:
 *               memory:
 *                 used: 67108864
 *                 total: 134217728
 *                 free: 67108864
 *               cpu:
 *                 usage: 15.5
 *               requests:
 *                 total: 1250
 *                 rate: 12.5
 *               uptime: 3600
 *       500:
 *         description: Error retrieving metrics
 */
router.get('/metrics', HealthController.getMetrics);

export { router as healthRouter };
