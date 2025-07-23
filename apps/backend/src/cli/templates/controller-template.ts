interface GenerateOptions {
  type: 'crud' | 'auth' | 'api' | 'service';
  database: boolean;
  auth: boolean;
  websocket: boolean;
}

export function createControllerTemplate(pluginName: string, className: string, options: GenerateOptions): string {
  return `import { Request, Response } from 'express';
import { ${className}Service } from '../services/${pluginName}.service';
import { logger } from '../../../core/logger';
import { ApiResponse } from '../../../types/api';

export class ${className}Controller {
  constructor(private ${pluginName}Service: ${className}Service) {}

  // GET /api/${pluginName}
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search } = req.query;
      
      const result = await this.${pluginName}Service.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string
      });

      const response: ApiResponse = {
        success: true,
        data: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao buscar ${pluginName}:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/${pluginName}/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const item = await this.${pluginName}Service.findById(id);
      
      if (!item) {
        res.status(404).json({
          success: false,
          error: '${className} não encontrado'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: item
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao buscar ${pluginName} por ID:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/${pluginName}
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      ${options.auth ? `const userId = req.user?.id;` : ''}
      
      const item = await this.${pluginName}Service.create({
        ...data,
        ${options.auth ? 'userId,' : ''}
      });

      const response: ApiResponse = {
        success: true,
        data: item,
        message: '${className} criado com sucesso'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Erro ao criar ${pluginName}:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // PUT /api/${pluginName}/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;
      ${options.auth ? `const userId = req.user?.id;` : ''}
      
      const item = await this.${pluginName}Service.update(id, {
        ...data,
        ${options.auth ? 'updatedBy: userId,' : ''}
      });

      if (!item) {
        res.status(404).json({
          success: false,
          error: '${className} não encontrado'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: item,
        message: '${className} atualizado com sucesso'
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao atualizar ${pluginName}:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // DELETE /api/${pluginName}/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const deleted = await this.${pluginName}Service.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: '${className} não encontrado'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: '${className} deletado com sucesso'
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao deletar ${pluginName}:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}
`;
}