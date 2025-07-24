import fs from 'fs/promises';
import path from 'path';
import { prisma } from './database';
import { Logger } from '../utils/logger';

interface Migration {
  filename: string;
  plugin: string;
  timestamp: string;
  name: string;
}

export class MigrationManager {
  private static instance: MigrationManager;
  
  static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  async initMigrationsTable(): Promise<void> {
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS plugin_migrations (
          id SERIAL PRIMARY KEY,
          plugin_name VARCHAR(100) NOT NULL,
          migration_name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(plugin_name, migration_name)
        )
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_plugin_migrations_plugin_name 
        ON plugin_migrations(plugin_name)
      `;
      
      logger.info('Tabela de migrations inicializada');
    } catch (error) {
      logger.error('Erro ao inicializar tabela de migrations:', error);
      throw error;
    }
  }

  async getExecutedMigrations(pluginName?: string): Promise<string[]> {
    try {
      const where = pluginName ? 
        `WHERE plugin_name = '${pluginName}'` : '';
      
      const result = await prisma.$queryRaw<Array<{migration_name: string}>>`
        SELECT migration_name 
        FROM plugin_migrations 
        ${where}
        ORDER BY executed_at ASC
      `;
      
      return result.map(row => row.migration_name);
    } catch (error) {
      logger.error('Erro ao buscar migrations executadas:', error);
      return [];
    }
  }

  async getPendingMigrations(pluginName?: string): Promise<Migration[]> {
    try {
      const executed = await this.getExecutedMigrations(pluginName);
      const available = await this.getAvailableMigrations(pluginName);
      
      return available.filter(migration => 
        !executed.includes(migration.name)
      );
    } catch (error) {
      logger.error('Erro ao buscar migrations pendentes:', error);
      return [];
    }
  }

  async getAvailableMigrations(pluginName?: string): Promise<Migration[]> {
    try {
      const migrations: Migration[] = [];
      const modulesDir = path.join(process.cwd(), 'src', 'modules');
      
      // Se plugin específico foi informado
      if (pluginName) {
        const migrationDir = path.join(modulesDir, pluginName, 'migrations');
        try {
          const files = await fs.readdir(migrationDir);
          const sqlFiles = files.filter(file => file.endsWith('.sql'));
          
          for (const file of sqlFiles) {
            migrations.push(this.parseMigrationFilename(file, pluginName));
          }
        } catch {
          // Plugin não tem migrations
        }
        
        return migrations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      }
      
      // Buscar migrations de todos os plugins
      const plugins = await fs.readdir(modulesDir, { withFileTypes: true });
      
      for (const plugin of plugins) {
        if (!plugin.isDirectory()) continue;
        
        const migrationDir = path.join(modulesDir, plugin.name, 'migrations');
        
        try {
          const files = await fs.readdir(migrationDir);
          const sqlFiles = files.filter(file => file.endsWith('.sql'));
          
          for (const file of sqlFiles) {
            migrations.push(this.parseMigrationFilename(file, plugin.name));
          }
        } catch {
          // Plugin não tem migrations
        }
      }
      
      return migrations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    } catch (error) {
      logger.error('Erro ao buscar migrations disponíveis:', error);
      return [];
    }
  }

  private parseMigrationFilename(filename: string, pluginName: string): Migration {
    // Formato: YYYYMMDDHHMMSS_migration_name.sql
    const match = filename.match(/^(\d{14})_(.+)\.sql$/);
    
    if (!match) {
      throw new Error(`Nome de migration inválido: ${filename}`);
    }
    
    const [, timestamp, name] = match;
    
    return {
      filename,
      plugin: pluginName,
      timestamp,
      name: name.replace(/_/g, '-')
    };
  }

  async runMigration(migration: Migration): Promise<void> {
    try {
      const migrationPath = path.join(
        process.cwd(), 
        'src', 
        'modules', 
        migration.plugin, 
        'migrations', 
        migration.filename
      );
      
      const sql = await fs.readFile(migrationPath, 'utf-8');
      
      logger.info(`Executando migration: ${migration.plugin}/${migration.filename}`);
      
      // Executar migration em uma transação
      await prisma.$transaction(async (tx) => {
        // Executar SQL da migration
        await tx.$executeRawUnsafe(sql);
        
        // Registrar migration como executada
        await tx.$executeRaw`
          INSERT INTO plugin_migrations (plugin_name, migration_name)
          VALUES (${migration.plugin}, ${migration.name})
          ON CONFLICT (plugin_name, migration_name) DO NOTHING
        `;
      });
      
      logger.info(`Migration executada com sucesso: ${migration.plugin}/${migration.filename}`);
    } catch (error) {
      logger.error(`Erro ao executar migration ${migration.plugin}/${migration.filename}:`, error);
      throw error;
    }
  }

  async runMigrations(pluginName?: string): Promise<void> {
    try {
      await this.initMigrationsTable();
      
      const pending = await this.getPendingMigrations(pluginName);
      
      if (pending.length === 0) {
        logger.info(pluginName ? 
          `Nenhuma migration pendente para o plugin ${pluginName}` :
          'Nenhuma migration pendente'
        );
        return;
      }
      
      logger.info(`Executando ${pending.length} migration(s)...`);
      
      for (const migration of pending) {
        await this.runMigration(migration);
      }
      
      logger.info('Todas as migrations foram executadas com sucesso');
    } catch (error) {
      logger.error('Erro ao executar migrations:', error);
      throw error;
    }
  }

  async createMigration(pluginName: string, migrationName: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString()
        .replace(/[-:]/g, '')
        .replace(/\..+/, '');
      
      const filename = `${timestamp}_${migrationName.replace(/\s+/g, '_').toLowerCase()}.sql`;
      const migrationDir = path.join(process.cwd(), 'src', 'modules', pluginName, 'migrations');
      const migrationPath = path.join(migrationDir, filename);
      
      // Criar diretório se não existir
      await fs.mkdir(migrationDir, { recursive: true });
      
      // Template básico da migration
      const template = `-- Migration: ${migrationName}
-- Plugin: ${pluginName}
-- Criado em: ${new Date().toISOString()}

-- Escreva sua migration aqui
-- Exemplo:
-- CREATE TABLE example (
--   id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
--   name VARCHAR(100) NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- Registrar migration (não modificar)
INSERT INTO plugin_migrations (plugin_name, migration_name) VALUES 
  ('${pluginName}', '${migrationName.replace(/\s+/g, '-').toLowerCase()}')
ON CONFLICT (plugin_name, migration_name) DO NOTHING;
`;
      
      await fs.writeFile(migrationPath, template);
      
      logger.info(`Migration criada: ${migrationPath}`);
      return migrationPath;
    } catch (error) {
      logger.error('Erro ao criar migration:', error);
      throw error;
    }
  }
}

// Funções de conveniência
export const runMigrations = (pluginName?: string) => 
  MigrationManager.getInstance().runMigrations(pluginName);

export const createMigration = (pluginName: string, migrationName: string) =>
  MigrationManager.getInstance().createMigration(pluginName, migrationName);

export const getPendingMigrations = (pluginName?: string) =>
  MigrationManager.getInstance().getPendingMigrations(pluginName);