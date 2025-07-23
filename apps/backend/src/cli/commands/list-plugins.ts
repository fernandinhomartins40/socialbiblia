import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../core/logger';

interface ListOptions {
  all: boolean;
}

export async function listPlugins(options: ListOptions) {
  try {
    console.log('📋 Listando plugins...\n');
    
    const pluginsDir = path.join(process.cwd(), 'src', 'modules');
    
    // Verificar se diretório existe
    try {
      await fs.access(pluginsDir);
    } catch {
      console.log('❌ Diretório de plugins não encontrado');
      return;
    }
    
    const plugins = await fs.readdir(pluginsDir, { withFileTypes: true });
    const pluginDirs = plugins.filter(dirent => dirent.isDirectory());
    
    if (pluginDirs.length === 0) {
      console.log('📦 Nenhum plugin encontrado');
      return;
    }
    
    console.log(`🔌 Encontrados ${pluginDirs.length} plugin(s):\n`);
    
    for (const pluginDir of pluginDirs) {
      try {
        const pluginPath = path.join(pluginsDir, pluginDir.name, 'index.ts');
        const pluginContent = await fs.readFile(pluginPath, 'utf-8');
        
        // Extrair metadata do plugin
        const metadata = extractPluginMetadata(pluginContent);
        
        if (!options.all && !metadata.enabled) {
          continue;
        }
        
        const status = metadata.enabled ? '🟢 Ativo' : '🔴 Inativo';
        const priority = metadata.priority || 10;
        
        console.log(`📦 ${metadata.name || pluginDir.name}`);
        console.log(`   Status: ${status}`);
        console.log(`   Versão: ${metadata.version || '1.0.0'}`);
        console.log(`   Prioridade: ${priority}`);
        console.log(`   Descrição: ${metadata.description || 'Sem descrição'}`);
        
        if (metadata.dependencies && metadata.dependencies.length > 0) {
          console.log(`   Dependências: ${metadata.dependencies.join(', ')}`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`⚠️  ${pluginDir.name} (erro ao ler metadata)`);
        console.log('');
      }
    }
    
  } catch (error) {
    logger.error('Erro ao listar plugins:', error);
    console.error('❌ Erro ao listar plugins');
    process.exit(1);
  }
}

function extractPluginMetadata(pluginContent: string): any {
  try {
    // Extrair o objeto metadata usando regex
    const metadataMatch = pluginContent.match(/metadata\s*=\s*{([^}]+)}/s);
    
    if (!metadataMatch) {
      return { enabled: true };
    }
    
    const metadataStr = metadataMatch[1];
    
    // Extrair campos individualmente
    const nameMatch = metadataStr.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const versionMatch = metadataStr.match(/version:\s*['"`]([^'"`]+)['"`]/);
    const descriptionMatch = metadataStr.match(/description:\s*['"`]([^'"`]+)['"`]/);
    const enabledMatch = metadataStr.match(/enabled:\s*(true|false)/);
    const priorityMatch = metadataStr.match(/priority:\s*(\d+)/);
    const dependenciesMatch = metadataStr.match(/dependencies:\s*\[([^\]]*)\]/);
    
    const metadata: any = {
      name: nameMatch?.[1],
      version: versionMatch?.[1],
      description: descriptionMatch?.[1],
      enabled: enabledMatch?.[1] === 'true',
      priority: priorityMatch ? parseInt(priorityMatch[1]) : undefined
    };
    
    if (dependenciesMatch) {
      metadata.dependencies = dependenciesMatch[1]
        .split(',')
        .map(dep => dep.replace(/['"`\s]/g, ''))
        .filter(dep => dep.length > 0);
    }
    
    return metadata;
    
  } catch (error) {
    return { enabled: true };
  }
}