import { MigrationManager } from '../../core/migrations';
import { logger } from '../../core/logger';

interface MigrateOptions {
  plugin?: string;
}

export async function runMigrations(options: MigrateOptions) {
  try {
    const migrationManager = MigrationManager.getInstance();
    
    if (options.plugin) {
      console.log(`🔄 Executando migrations do plugin "${options.plugin}"...`);
    } else {
      console.log('🔄 Executando migrations de todos os plugins...');
    }
    
    // Verificar migrations pendentes
    const pending = await migrationManager.getPendingMigrations(options.plugin);
    
    if (pending.length === 0) {
      console.log('✅ Nenhuma migration pendente encontrada');
      return;
    }
    
    console.log(`📋 Encontradas ${pending.length} migration(s) pendente(s):`);
    for (const migration of pending) {
      console.log(`   - ${migration.plugin}/${migration.filename}`);
    }
    console.log('');
    
    // Executar migrations
    await migrationManager.runMigrations(options.plugin);
    
    console.log('✅ Todas as migrations foram executadas com sucesso!');
    
  } catch (error) {
    logger.error('Erro ao executar migrations:', error);
    console.error('❌ Erro ao executar migrations');
    process.exit(1);
  }
}