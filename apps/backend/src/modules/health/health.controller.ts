import { Request, Response } from 'express';
import { ResponseUtil } from '../../utils/responses';
import { prisma } from '../../core/database';

export class HealthController {
  static async getHealth(_req: Request, res: Response) {
    try {
      // Verificar conexão com o banco
      await prisma.$queryRaw`SELECT 1`;
      
      res.json(ResponseUtil.success({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        memory: process.memoryUsage(),
      }, 'Servidor está funcionando'));
    } catch {
      res.status(503).json(
        ResponseUtil.error('Serviço indisponível', 'Erro ao conectar com o banco de dados')
      );
    }
  }

  static async getReady(_req: Request, res: Response) {
    try {
      // Verificar se o banco está pronto
      await prisma.$queryRaw`SELECT 1`;
      
      res.json(ResponseUtil.success({
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'ready',
      }, 'Servidor está pronto'));
    } catch {
      res.status(503).json(
        ResponseUtil.error('Serviço não pronto', 'Banco de dados não está pronto')
      );
    }
  }

  static async getMetrics(_req: Request, res: Response) {
    try {
      const [userCount, postCount, commentCount] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.post.count({ where: { deletedAt: null } }),
        prisma.comment.count({ where: { deletedAt: null } }),
      ]);

      res.json(ResponseUtil.success({
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: {
          users: userCount,
          posts: postCount,
          comments: commentCount,
        },
      }, 'Métricas do sistema'));
    } catch {
      res.status(500).json(
        ResponseUtil.error('Erro ao obter métricas', 'Erro ao coletar dados do sistema')
      );
    }
  }

  static async getPerformance(_req: Request, res: Response) {
    try {
      const metrics = {
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date(),
        },
        database: {
          connected: true,
        }
      };

      res.json(ResponseUtil.success({
        status: 'healthy',
        metrics,
        issues: [],
      }, 'Status de performance'));
    } catch {
      res.status(500).json(
        ResponseUtil.error('Erro ao obter status de performance', 'Erro ao coletar dados de performance')
      );
    }
  }
}
