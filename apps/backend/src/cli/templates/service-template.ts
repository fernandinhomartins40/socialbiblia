interface GenerateOptions {
  type: 'crud' | 'auth' | 'api' | 'service';
  database: boolean;
  auth: boolean;
  websocket: boolean;
}

export function createServiceTemplate(pluginName: string, className: string, options: GenerateOptions): string {
  return `import { prisma } from '../../../core/database';
import { Logger } from '../../../utils/logger';
${options.database ? `import { runMigrations } from '../../../core/migrations';` : ''}
import { PaginatedResult } from '../../../types/pagination';

interface Create${className}Data {
  name: string;
  description?: string;
  ${options.auth ? 'userId: string;' : ''}
  [key: string]: any;
}

interface Update${className}Data {
  name?: string;
  description?: string;
  ${options.auth ? 'updatedBy?: string;' : ''}
  [key: string]: any;
}

interface Find${className}Options {
  page: number;
  limit: number;
  search?: string;
}

export class ${className}Service {
  private tableName = '${pluginName}';

  async init(): Promise<void> {
    logger.info(\`Inicializando \${this.constructor.name}...\`);
    
    ${options.database ? `// Executar migrations do plugin
    try {
      await runMigrations('${pluginName}');
      logger.info(\`Migrations do plugin ${pluginName} executadas com sucesso\`);
    } catch (error) {
      logger.error(\`Erro ao executar migrations do plugin ${pluginName}:\`, error);
      throw error;
    }` : ''}
    
    logger.info(\`\${this.constructor.name} inicializado com sucesso\`);
  }

  async cleanup(): Promise<void> {
    logger.info(\`Finalizando \${this.constructor.name}...\`);
    // Cleanup logic aqui se necessário
  }

  async findAll(options: Find${className}Options): Promise<PaginatedResult<any>> {
    try {
      const { page, limit, search } = options;
      const skip = (page - 1) * limit;

      // Para plugins com banco próprio, usar query SQL direta
      ${options.database ? `const whereClause = search 
        ? \`WHERE name ILIKE '%\${search}%' OR description ILIKE '%\${search}%'\`
        : '';
      
      const countQuery = \`SELECT COUNT(*) as total FROM \${this.tableName} \${whereClause}\`;
      const dataQuery = \`
        SELECT * FROM \${this.tableName} 
        \${whereClause}
        ORDER BY created_at DESC
        LIMIT \${limit} OFFSET \${skip}
      \`;

      const [countResult, dataResult] = await Promise.all([
        prisma.$queryRaw\`\${countQuery}\`,
        prisma.$queryRaw\`\${dataQuery}\`
      ]);

      const total = Number((countResult as any)[0]?.total || 0);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult as any[],
        page,
        limit,
        total,
        totalPages
      };` : `// Exemplo usando Prisma (ajustar conforme necessário)
      const where = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {};

      const [total, data] = await Promise.all([
        prisma.${pluginName}.count({ where }),
        prisma.${pluginName}.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        })
      ]);

      return {
        data,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };`}
    } catch (error) {
      logger.error(\`Erro ao buscar \${this.tableName}:\`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<any | null> {
    try {
      ${options.database ? `const result = await prisma.$queryRaw\`
        SELECT * FROM \${this.tableName} WHERE id = \${id}
      \`;
      
      return (result as any[])[0] || null;` : `return await prisma.${pluginName}.findUnique({
        where: { id }
      });`}
    } catch (error) {
      logger.error(\`Erro ao buscar \${this.tableName} por ID:\`, error);
      throw error;
    }
  }

  async create(data: Create${className}Data): Promise<any> {
    try {
      ${options.database ? `const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const result = await prisma.$queryRaw\`
        INSERT INTO \${this.tableName} (
          id, name, description, ${options.auth ? 'user_id, ' : ''}created_at, updated_at
        ) VALUES (
          \${id}, \${data.name}, \${data.description || ''}, 
          ${options.auth ? '${data.userId}, ' : ''}\${now}, \${now}
        )
        RETURNING *
      \`;
      
      return (result as any[])[0];` : `return await prisma.${pluginName}.create({
        data: {
          ...data,
          ${options.auth ? 'userId: data.userId' : ''}
        }
      });`}
    } catch (error) {
      logger.error(\`Erro ao criar \${this.tableName}:\`, error);
      throw error;
    }
  }

  async update(id: string, data: Update${className}Data): Promise<any | null> {
    try {
      ${options.database ? `const now = new Date().toISOString();
      const setClauses = [];
      const values = [now]; // updated_at sempre atualizado
      
      if (data.name) {
        setClauses.push(\`name = $\${values.length + 1}\`);
        values.push(data.name);
      }
      
      if (data.description !== undefined) {
        setClauses.push(\`description = $\${values.length + 1}\`);
        values.push(data.description);
      }
      
      ${options.auth ? `if (data.updatedBy) {
        setClauses.push(\`updated_by = $\${values.length + 1}\`);
        values.push(data.updatedBy);
      }` : ''}
      
      if (setClauses.length === 0) {
        return await this.findById(id);
      }
      
      const query = \`
        UPDATE \${this.tableName} 
        SET updated_at = $1, \${setClauses.join(', ')}
        WHERE id = $\${values.length + 1}
        RETURNING *
      \`;
      
      values.push(id);
      
      const result = await prisma.$queryRaw\`\${query}\`;
      return (result as any[])[0] || null;` : `return await prisma.${pluginName}.update({
        where: { id },
        data
      });`}
    } catch (error) {
      logger.error(\`Erro ao atualizar \${this.tableName}:\`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      ${options.database ? `const result = await prisma.$queryRaw\`
        DELETE FROM \${this.tableName} WHERE id = \${id}
      \`;
      
      return (result as any).count > 0;` : `const deleted = await prisma.${pluginName}.delete({
        where: { id }
      });
      
      return !!deleted;`}
    } catch (error) {
      logger.error(\`Erro ao deletar \${this.tableName}:\`, error);
      throw error;
    }
  }
}
`;
}