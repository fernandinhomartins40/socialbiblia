import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../../utils/logger';

export async function enablePlugin(name: string) {
  try {
    console.log(`🔌 Habilitando plugin "${name}"...`);
    
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
    
    // Verificar se já está habilitado
    if (pluginContent.includes('enabled: true')) {
      console.log(`✅ Plugin "${name}" já está habilitado`);
      return;
    }
    
    // Substituir enabled: false por enabled: true
    pluginContent = pluginContent.replace(
      /enabled:\s*false/g,
      'enabled: true'
    );
    
    // Salvar arquivo
    await fs.writeFile(pluginPath, pluginContent);
    
    console.log(`✅ Plugin "${name}" habilitado com sucesso!`);
    console.log(`📋 Reinicie o servidor para aplicar as mudanças: npm run dev`);
    
  } catch (error) {
    logger.error('Erro ao habilitar plugin:', error);
    console.error('❌ Erro ao habilitar plugin');
    process.exit(1);
  }
}