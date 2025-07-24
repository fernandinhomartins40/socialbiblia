import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../../utils/logger';

export async function disablePlugin(name: string) {
  try {
    console.log(`🔌 Desabilitando plugin "${name}"...`);
    
    const pluginPath = path.join(process.cwd(), 'src', 'modules', name, 'index.ts');
    
    // Verificar se plugin existe
    try {
      await fs.access(pluginPath);
    } catch {
      console.error(`❌ Plugin "${name}" não encontrado`);
      process.exit(1);
    }
    
    // Ler conteúdo do plugin
    let pluginContent = await fs.readFile(pluginPath, 'utf-8');
    
    // Verificar se já está desabilitado
    if (pluginContent.includes('enabled: false')) {
      console.log(`✅ Plugin "${name}" já está desabilitado`);
      return;
    }
    
    // Substituir enabled: true por enabled: false
    pluginContent = pluginContent.replace(
      /enabled:\s*true/g,
      'enabled: false'
    );
    
    // Salvar arquivo
    await fs.writeFile(pluginPath, pluginContent);
    
    console.log(`✅ Plugin "${name}" desabilitado com sucesso!`);
    console.log(`📋 Reinicie o servidor para aplicar as mudanças: npm run dev`);
    
  } catch (error) {
    Logger.error('Erro ao desabilitar plugin:', error instanceof Error ? error : new Error(String(error)));
    console.error('❌ Erro ao desabilitar plugin');
    process.exit(1);
  }
}