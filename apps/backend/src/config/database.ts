import { PrismaClient } from '@prisma/client';
// import { logger } from '../utils/logger/winston/logger';

// Configuração de connection pooling para PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configurações específicas por ambiente
const getDatabaseConfig = () => {
  const baseConfig = {
    log: NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    errorFormat: 'pretty' as const,
  };

  if (NODE_ENV === 'production') {
    return {
      ...baseConfig,
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
      // Connection pooling otimizado para produção
      __internal: {
        engine: {
          // Pool de conexões otimizado
          connectionLimit: 20,
          poolTimeout: 20000,
          // Otimizações específicas do PostgreSQL
          schema: 'public',
        },
      },
    };
  }

  // Configuração para desenvolvimento
  return {
    ...baseConfig,
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  };
};

// Singleton instance do PrismaClient
class DatabaseManager {
  private static instance: PrismaClient;
  private static isConnected = false;

  static getInstance(): PrismaClient {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new PrismaClient(getDatabaseConfig());
      
      // Middleware para logging de queries lentas
      DatabaseManager.instance.$use(async (params, next) => {
        const start = Date.now();
        const result = await next(params);
        const duration = Date.now() - start;
        
        // Log queries que demoram mais de 100ms
        if (duration > 100) {
          console.log('slow_query', {
            model: params.model,
            action: params.action,
            duration: `${duration}ms`,
            args: params.args,
          });
        }
        
        return result;
      });

      // Middleware para soft delete
      DatabaseManager.instance.$use(async (params, next) => {
        // Interceptar operações de delete e transformar em soft delete
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deletedAt: new Date() };
        }
        
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args.data !== undefined) {
            params.args.data.deletedAt = new Date();
          } else {
            params.args.data = { deletedAt: new Date() };
          }
        }
        
        return next(params);
      });

      // Middleware para filtrar registros deletados por padrão
      DatabaseManager.instance.$use(async (params, next) => {
        // Adicionar filtro deletedAt: null para operações de leitura
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.args.where = { deletedAt: null, ...params.args.where };
        }
        
        if (params.action === 'findMany') {
          if (params.args.where) {
            if (!params.args.where.deletedAt) {
              params.args.where.deletedAt = null;
            }
          } else {
            params.args.where = { deletedAt: null };
          }
        }
        
        return next(params);
      });

      // Event listeners para monitoramento
      DatabaseManager.instance.$on('query', (e) => {
        if (NODE_ENV === 'development') {
          console.log(`Query: ${e.query}`, {
            params: e.params,
            duration: `${e.duration}ms`,
            target: e.target,
          });
        }
      });

      DatabaseManager.instance.$on('error', (e) => {
        console.error('database_error', e.message, {
          target: e.target,
          timestamp: e.timestamp,
        });
      });

      DatabaseManager.instance.$on('warn', (e) => {
        console.warn(`Database warning: ${e.message}`, {
          target: e.target,
          timestamp: e.timestamp,
        });
      });

      DatabaseManager.instance.$on('info', (e) => {
        console.log(`Database info: ${e.message}`, {
          target: e.target,
          timestamp: e.timestamp,
        });
      });
    }

    return DatabaseManager.instance;
  }

  static async connect(): Promise<void> {
    if (DatabaseManager.isConnected) {
      return;
    }

    try {
      const prisma = DatabaseManager.getInstance();
      
      // Testar conexão
      await prisma.$connect();
      
      // Verificar se pode executar queries
      await prisma.$queryRaw`SELECT 1`;
      
      DatabaseManager.isConnected = true;
      
      console.log('database_connected', 'Database connection established', {
        provider: 'postgresql',
        environment: NODE_ENV,
      });
      
    } catch (error) {
      console.error('database_connection_error', 'Failed to connect to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        databaseUrl: DATABASE_URL ? 'configured' : 'missing',
      });
      
      throw new Error('Database connection failed');
    }
  }

  static async disconnect(): Promise<void> {
    if (DatabaseManager.instance && DatabaseManager.isConnected) {
      await DatabaseManager.instance.$disconnect();
      DatabaseManager.isConnected = false;
      
      console.log('Database disconnected');
    }
  }

  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      responseTime: number;
      error?: string;
    };
  }> {
    try {
      const start = Date.now();
      const prisma = DatabaseManager.getInstance();
      
      // Testar query simples
      await prisma.$queryRaw`SELECT 1 as health_check`;
      
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        details: {
          connected: DatabaseManager.isConnected,
          responseTime,
        },
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          responseTime: -1,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Métodos utilitários para queries otimizadas
  static async executeInTransaction<T>(
    operation: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    const prisma = DatabaseManager.getInstance();
    return prisma.$transaction(operation);
  }

  // Método para forçar delete (bypass soft delete)
  static async hardDelete(model: string, where: any): Promise<any> {
    const prisma = DatabaseManager.getInstance();
    return (prisma as any)[model].deleteMany({
      where: {
        ...where,
        deletedAt: { not: null }, // Só deleta registros já soft-deleted
      },
    });
  }

  // Método para incluir registros deletados na busca
  static async findWithDeleted(model: string, args: any): Promise<any> {
    const prisma = DatabaseManager.getInstance();
    
    // Remover filtro deletedAt se existir
    if (args.where && args.where.deletedAt === null) {
      delete args.where.deletedAt;
    }
    
    return (prisma as any)[model].findMany(args);
  }

  // Método para restaurar registros soft-deleted
  static async restore(model: string, where: any): Promise<any> {
    const prisma = DatabaseManager.getInstance();
    return (prisma as any)[model].updateMany({
      where: {
        ...where,
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
      },
    });
  }
}

// Export da instância singleton
export const prisma = DatabaseManager.getInstance();
export { DatabaseManager };

// Export de utility functions
export const db = {
  connect: DatabaseManager.connect,
  disconnect: DatabaseManager.disconnect,
  healthCheck: DatabaseManager.healthCheck,
  transaction: DatabaseManager.executeInTransaction,
  hardDelete: DatabaseManager.hardDelete,
  findWithDeleted: DatabaseManager.findWithDeleted,
  restore: DatabaseManager.restore,
};

// Configuração de graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection...');
  await DatabaseManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await DatabaseManager.disconnect();
  process.exit(0);
});

// Auto-connect em desenvolvimento
if (NODE_ENV === 'development') {
  DatabaseManager.connect().catch((error) => {
    console.error('auto_connect_failed', 'Failed to auto-connect in development', {
      error: error.message,
    });
  });
}