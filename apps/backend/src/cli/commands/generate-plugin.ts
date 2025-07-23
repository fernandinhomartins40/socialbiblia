import fs from 'fs/promises';
import path from 'path';
import { pascalCase, camelCase, kebabCase } from '../utils/string-utils';
import { createPluginTemplate } from '../templates/plugin-template';
import { createControllerTemplate } from '../templates/controller-template';
import { createServiceTemplate } from '../templates/service-template';
import { createRoutesTemplate } from '../templates/routes-template';
import { createSchemaTemplate } from '../templates/schema-template';
import { createMigrationTemplate } from '../templates/migration-template';

interface GenerateOptions {
  type: 'crud' | 'auth' | 'api' | 'service';
  database: boolean;
  auth: boolean;
  websocket: boolean;
}

export async function generatePlugin(name: string, options: GenerateOptions) {
  try {
    console.log(`🚀 Gerando plugin "${name}"...`);
    
    const pluginName = kebabCase(name);
    const className = pascalCase(name);
    const camelName = camelCase(name);
    
    const pluginDir = path.join(process.cwd(), 'src', 'modules', pluginName);
    
    // Verificar se plugin já existe
    try {
      await fs.access(pluginDir);
      console.error(`❌ Plugin "${pluginName}" já existe!`);
      process.exit(1);
    } catch {
      // Plugin não existe, podemos continuar
    }
    
    // Criar estrutura de diretórios
    await fs.mkdir(pluginDir, { recursive: true });
    await fs.mkdir(path.join(pluginDir, 'controllers'), { recursive: true });
    await fs.mkdir(path.join(pluginDir, 'services'), { recursive: true });
    await fs.mkdir(path.join(pluginDir, 'routes'), { recursive: true });
    await fs.mkdir(path.join(pluginDir, 'schemas'), { recursive: true });
    
    if (options.database) {
      await fs.mkdir(path.join(pluginDir, 'migrations'), { recursive: true });
    }
    
    // Gerar arquivos do plugin
    const pluginContent = createPluginTemplate(pluginName, className, options);
    await fs.writeFile(path.join(pluginDir, 'index.ts'), pluginContent);
    
    const controllerContent = createControllerTemplate(pluginName, className, options);
    await fs.writeFile(path.join(pluginDir, 'controllers', `${pluginName}.controller.ts`), controllerContent);
    
    const serviceContent = createServiceTemplate(pluginName, className, options);
    await fs.writeFile(path.join(pluginDir, 'services', `${pluginName}.service.ts`), serviceContent);
    
    const routesContent = createRoutesTemplate(pluginName, className, options);
    await fs.writeFile(path.join(pluginDir, 'routes', `${pluginName}.routes.ts`), routesContent);
    
    const schemaContent = createSchemaTemplate(pluginName, className, options);
    await fs.writeFile(path.join(pluginDir, 'schemas', `${pluginName}.schema.ts`), schemaContent);
    
    // Gerar migration se database estiver habilitado
    if (options.database) {
      const migrationContent = createMigrationTemplate(pluginName, className);
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
      await fs.writeFile(
        path.join(pluginDir, 'migrations', `${timestamp}_create_${pluginName}.sql`),
        migrationContent
      );
    }
    
    // Gerar README do plugin
    const readmeContent = generateReadme(pluginName, className, options);
    await fs.writeFile(path.join(pluginDir, 'README.md'), readmeContent);
    
    console.log(`✅ Plugin "${pluginName}" gerado com sucesso!`);
    console.log(`📁 Localização: ${pluginDir}`);
    console.log(`\n📋 Próximos passos:`);
    console.log(`1. Configurar variáveis de ambiente se necessário`);
    console.log(`2. Executar migrations: plugbase migrate -p ${pluginName}`);
    console.log(`3. Implementar lógica específica nos controllers e services`);
    console.log(`4. Testar o plugin: npm run dev`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar plugin:', error);
    process.exit(1);
  }
}

function generateReadme(pluginName: string, className: string, options: GenerateOptions): string {
  return `# ${className} Plugin

Plugin gerado automaticamente pelo Plugbase CLI.

## Recursos

- ✅ Estrutura CRUD básica
${options.auth ? '- ✅ Autenticação integrada' : ''}
${options.database ? '- ✅ Schema de banco de dados' : ''}
${options.websocket ? '- ✅ Suporte a WebSocket' : ''}

## Endpoints

### Públicos
- \`GET /api/${pluginName}\` - Listar itens
- \`GET /api/${pluginName}/:id\` - Obter item por ID

### Protegidos (requer autenticação)
- \`POST /api/${pluginName}\` - Criar novo item
- \`PUT /api/${pluginName}/:id\` - Atualizar item
- \`DELETE /api/${pluginName}/:id\` - Deletar item

## Configuração

1. Configure as variáveis de ambiente necessárias no \`.env\`
2. Execute as migrations: \`plugbase migrate -p ${pluginName}\`
3. Reinicie o servidor: \`npm run dev\`

## Personalização

- **Controllers**: \`controllers/${pluginName}.controller.ts\`
- **Services**: \`services/${pluginName}.service.ts\`
- **Routes**: \`routes/${pluginName}.routes.ts\`
- **Schemas**: \`schemas/${pluginName}.schema.ts\`
${options.database ? `- **Migrations**: \`migrations/\`` : ''}

## Testes

Execute os testes do plugin:

\`\`\`bash
npm test -- ${pluginName}
\`\`\`
`;
}