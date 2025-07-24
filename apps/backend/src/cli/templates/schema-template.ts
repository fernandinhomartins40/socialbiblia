interface GenerateOptions {
  type: 'crud' | 'auth' | 'api' | 'service';
  database: boolean;
  auth: boolean;
  websocket: boolean;
}

export function createSchemaTemplate(pluginName: string, className: string, options: GenerateOptions): string {
  return `import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../../utils/logger';

// Schema para criação
export const create${className}Schema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  ${options.auth ? `// userId será adicionado automaticamente pelo middleware de auth` : ''}
});

// Schema para atualização
export const update${className}Schema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
}).refine(data => 
  Object.keys(data).length > 0, 
  'Pelo menos um campo deve ser fornecido para atualização'
);

// Schema para parâmetros de busca
export const search${className}Schema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 1)
    .refine(val => val > 0, 'Página deve ser maior que 0'),
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 10)
    .refine(val => val > 0 && val <= 100, 'Limite deve ser entre 1 e 100'),
  search: z.string()
    .max(100, 'Termo de busca deve ter no máximo 100 caracteres')
    .optional()
});

// Middleware de validação para criação
export function validate${className}Create(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = create${className}Schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(\`Erro de validação na criação de ${pluginName}:\`, error.errors);
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    logger.error(\`Erro inesperado na validação de ${pluginName}:\`, error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Middleware de validação para atualização
export function validate${className}Update(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = update${className}Schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(\`Erro de validação na atualização de ${pluginName}:\`, error.errors);
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    logger.error(\`Erro inesperado na validação de ${pluginName}:\`, error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Middleware de validação para parâmetros de busca
export function validate${className}Search(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedQuery = search${className}Schema.parse(req.query);
    req.query = validatedQuery as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(\`Erro de validação na busca de ${pluginName}:\`, error.errors);
      return res.status(400).json({
        success: false,
        error: 'Parâmetros de busca inválidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    logger.error(\`Erro inesperado na validação de busca de ${pluginName}:\`, error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Tipos TypeScript gerados dos schemas
export type Create${className}Data = z.infer<typeof create${className}Schema>;
export type Update${className}Data = z.infer<typeof update${className}Schema>;
export type Search${className}Params = z.infer<typeof search${className}Schema>;
`;
}