import fs from 'fs/promises';
import path from 'path';
import { MigrationManager } from '../../core/migrations';
import { Logger } from '../../utils/logger';

interface CreateMigrationOptions {
  plugin?: string;
}

export async function createMigration(name: string, options: CreateMigrationOptions) {
  try {
    if (!options.plugin) {
      console.error('❌ Plugin é obrigatório. Use: plugbase migration <name> -p <plugin>');
      process.exit(1);
    }
    
    console.log(`📝 Criando migration "${name}" para o plugin "${options.plugin}"...`);
    
    // Verificar se plugin existe
    const pluginDir = path.join(process.cwd(), 'src', 'modules', options.plugin);
    try {
      await fs.access(pluginDir);
    } catch {
      console.error(`❌ Plugin "${options.plugin}" não encontrado`);
      process.exit(1);
    }
    
    const migrationManager = MigrationManager.getInstance();
    const migrationPath = await migrationManager.createMigration(options.plugin, name);
    
    console.log(`✅ Migration criada com sucesso!`);
    console.log(`📁 Localização: ${migrationPath}`);
    console.log(`\n📋 Próximos passos:`);
    console.log(`1. Edite o arquivo de migration e adicione seu SQL`);
    console.log(`2. Execute a migration: plugbase migrate -p ${options.plugin}`);
    
  } catch (error) {
    Logger.error('Erro ao criar migration:', error instanceof Error ? error : new Error(String(error)));
    console.error('❌ Erro ao criar migration');
    process.exit(1);
  }
}