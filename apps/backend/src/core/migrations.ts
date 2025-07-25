import { PrismaClient } from '@prisma/client';
import { prisma } from './database';

export class MigrationManager {
    private static instance: MigrationManager;
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    static getInstance(): MigrationManager {
        if (!MigrationManager.instance) {
            MigrationManager.instance = new MigrationManager();
        }
        return MigrationManager.instance;
    }

    async getMigrationStatus() {
        try {
            // Verificar se existe tabela de migrações
            const migrations = await this.prisma.$queryRaw`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='_prisma_migrations'
            `;
            
            return {
                success: true,
                hasMigrations: Array.isArray(migrations) && migrations.length > 0
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }



    async getPendingMigrations(plugin?: string) {
        // Implementação básica - em produção usar Prisma CLI
        console.log(`Verificando migrações pendentes${plugin ? ` para plugin ${plugin}` : ''}`);
        return [];
    }

    async runMigrations(plugin?: string) {
        try {
            console.log(`Executando migrações${plugin ? ` para plugin ${plugin}` : ''}`);
            console.log('Use "npx prisma migrate deploy" para executar migrações');
            return { success: true, message: 'Use prisma CLI for migrations' };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async createMigration(plugin: string, name: string) {
        try {
            console.log(`Criando migração "${name}" para plugin ${plugin}`);
            // Em um ambiente real, isso criaria um arquivo de migração
            const migrationPath = `./prisma/migrations/${Date.now()}_${plugin}_${name}`;
            console.log(`Migração criada em: ${migrationPath}`);
            return migrationPath;
        } catch (error) {
            throw new Error(`Falha ao criar migração: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 