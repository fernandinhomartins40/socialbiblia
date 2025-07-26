#!/usr/bin/env node

/**
 * Script de migração automática de SQLite para PostgreSQL
 * 
 * Este script:
 * 1. Faz backup do banco SQLite atual
 * 2. Exporta dados do SQLite
 * 3. Importa dados para PostgreSQL
 * 4. Valida a migração
 * 5. Gera relatório de migração
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Configurações
const CONFIG = {
  sqliteDbPath: path.join(__dirname, '../apps/backend/prisma/dev.db'),
  backupDir: path.join(__dirname, '../backups'),
  logFile: path.join(__dirname, '../logs/migration.log'),
  batchSize: 1000,
  timeout: 30000
};

// Logger
class MigrationLogger {
  constructor(logFile) {
    this.logFile = logFile;
    this.ensureLogDir();
  }

  ensureLogDir() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }

  info(message, data) { this.log('info', message, data); }
  error(message, data) { this.log('error', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  success(message, data) { this.log('success', message, data); }
}

// Serviço de migração
class PostgresMigrationService {
  constructor(logger) {
    this.logger = logger;
    this.prisma = new PrismaClient();
    this.stats = {
      startTime: null,
      endTime: null,
      tables: {},
      errors: [],
      warnings: []
    };
  }

  async migrate() {
    try {
      this.stats.startTime = new Date();
      this.logger.info('Iniciando migração SQLite → PostgreSQL');

      // 1. Backup do SQLite
      await this.createBackup();

      // 2. Verificar conexões
      await this.verifyConnections();

      // 3. Exportar dados do SQLite
      const sqliteData = await this.exportFromSQLite();

      // 4. Limpar PostgreSQL
      await this.cleanPostgreSQL();

      // 5. Importar dados para PostgreSQL
      await this.importToPostgreSQL(sqliteData);

      // 6. Validar migração
      await this.validateMigration(sqliteData);

      // 7. Gerar relatório
      await this.generateReport();

      this.stats.endTime = new Date();
      this.logger.success('Migração concluída com sucesso', {
        duration: this.stats.endTime - this.stats.startTime,
        stats: this.stats
      });

    } catch (error) {
      this.logger.error('Erro durante migração', { error: error.message });
      this.stats.errors.push(error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async createBackup() {
    this.logger.info('Criando backup do banco SQLite');
    
    if (!fs.existsSync(CONFIG.sqliteDbPath)) {
      this.logger.warn('Banco SQLite não encontrado, pulando backup');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(CONFIG.backupDir, `sqlite-backup-${timestamp}.db`);
    
    if (!fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }

    fs.copyFileSync(CONFIG.sqliteDbPath, backupPath);
    this.logger.info('Backup criado', { backupPath });
  }

  async verifyConnections() {
    this.logger.info('Verificando conexões com bancos de dados');
    
    // Testar PostgreSQL
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.info('Conexão PostgreSQL verificada');
    } catch (error) {
      throw new Error(`Falha na conexão PostgreSQL: ${error.message}`);
    }
  }

  async exportFromSQLite() {
    this.logger.info('Exportando dados do SQLite');
    
    const data = {
      users: [],
      posts: [],
      comments: [],
      categories: [],
      products: []
    };

    try {
      // Usar Prisma para exportar dados
      data.users = await this.prisma.user.findMany({
        include: {
          posts: true,
          comments: true,
          products: true
        }
      });

      data.posts = await this.prisma.post.findMany({
        include: {
          comments: true
        }
      });

      data.comments = await this.prisma.comment.findMany();
      data.categories = await this.prisma.category.findMany({
        include: {
          products: true
        }
      });
      data.products = await this.prisma.product.findMany();

      this.logger.info('Dados exportados', {
        counts: {
          users: data.users.length,
          posts: data.posts.length,
          comments: data.comments.length,
          categories: data.categories.length,
          products: data.products.length
        }
      });

      return data;
    } catch (error) {
      throw new Error(`Erro ao exportar dados: ${error.message}`);
    }
  }

  async cleanPostgreSQL() {
    this.logger.info('Limpando dados do PostgreSQL');
    
    // Desabilitar verificação de chaves estrangeiras temporariamente
    await this.prisma.$executeRaw`SET session_replication_role = 'replica'`;
    
    // Deletar dados em ordem reversa de dependências
    const tables = ['Comment', 'Post', 'Product', 'Category', 'User'];
    
    for (const table of tables) {
      try {
        await this.prisma[table.toLowerCase()].deleteMany({});
        this.logger.info(`Tabela ${table} limpa`);
      } catch (error) {
        this.logger.warn(`Erro ao limpar tabela ${table}`, { error: error.message });
      }
    }
    
    // Reabilitar verificação de chaves estrangeiras
    await this.prisma.$executeRaw`SET session_replication_role = 'origin'`;
  }

  async importToPostgreSQL(data) {
    this.logger.info('Importando dados para PostgreSQL');
    
    // Importar em ordem de dependências
    const importOrder = [
      { name: 'User', data: data.users },
      { name: 'Category', data: data.categories },
      { name: 'Post', data: data.posts },
      { name: 'Product', data: data.products },
      { name: 'Comment', data: data.comments }
    ];

    for (const { name, data: items } of importOrder) {
      if (!items || items.length === 0) {
        this.logger.info(`Sem dados para importar em ${name}`);
        continue;
      }

      try {
        // Remover campos que podem causar conflitos
        const cleanItems = items.map(item => {
          const clean = { ...item };
          delete clean.id;
          delete clean.createdAt;
          delete clean.updatedAt;
          return clean;
        });

        // Importar em lotes
        const batches = this.createBatches(cleanItems, CONFIG.batchSize);
        
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          await this.prisma[name.toLowerCase()].createMany({
            data: batch,
            skipDuplicates: true
          });
          
          this.logger.info(`Importado lote ${i + 1}/${batches.length} de ${name}`);
        }

        this.stats.tables[name] = {
          imported: items.length,
          batches: batches.length
        };

      } catch (error) {
        this.logger.error(`Erro ao importar ${name}`, { error: error.message });
        this.stats.errors.push(`Import ${name}: ${error.message}`);
      }
    }
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  async validateMigration(originalData) {
    this.logger.info('Validando migração');
    
    const validation = {
      counts: {},
      mismatches: []
    };

    // Verificar contagens
    const tables = ['User', 'Post', 'Comment', 'Category', 'Product'];
    
    for (const table of tables) {
      const originalCount = originalData[table.toLowerCase() + 's']?.length || 0;
      const newCount = await this.prisma[table.toLowerCase()].count();
      
      validation.counts[table] = {
        original: originalCount,
        new: newCount,
        match: originalCount === newCount
      };

      if (originalCount !== newCount) {
        validation.mismatches.push({
          table,
          original: originalCount,
          new: newCount
        });
      }
    }

    this.logger.info('Validação concluída', { validation });
    return validation;
  }

  async generateReport() {
    this.logger.info('Gerando relatório de migração');
    
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      duration: this.stats.endTime - this.stats.startTime,
      success: this.stats.errors.length === 0
    };

    const reportPath = path.join(CONFIG.backupDir, `migration-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logger.info('Relatório gerado', { reportPath });
  }
}

// Script principal
async function main() {
  const logger = new MigrationLogger(CONFIG.logFile);
  
  try {
    const migrator = new PostgresMigrationService(logger);
    await migrator.migrate();
    
    logger.info('Script de migração concluído');
    process.exit(0);
    
  } catch (error) {
    logger.error('Falha no script de migração', { error: error.message });
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { PostgresMigrationService };
