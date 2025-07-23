interface GenerateOptions {
  type: 'crud' | 'auth' | 'api' | 'service';
  database: boolean;
  auth: boolean;
  websocket: boolean;
}

export function createPluginTemplate(pluginName: string, className: string, options: GenerateOptions): string {
  return `import { Plugin, PluginRoute } from '../../types/plugin';
import { ${className}Controller } from './controllers/${pluginName}.controller';
import { ${className}Service } from './services/${pluginName}.service';
import { ${pluginName}Routes } from './routes/${pluginName}.routes';
${options.websocket ? `import { ${className}WebSocket } from './websocket/${pluginName}.websocket';` : ''}

class ${className}Plugin implements Plugin {
  metadata = {
    name: '${pluginName}',
    version: '1.0.0',
    description: 'Plugin ${className} gerado automaticamente',
    dependencies: ${options.auth ? "['auth']" : '[]'},
    enabled: true,
    priority: 10
  };

  private controller: ${className}Controller;
  private service: ${className}Service;
  ${options.websocket ? `private websocket: ${className}WebSocket;` : ''}

  constructor() {
    this.service = new ${className}Service();
    this.controller = new ${className}Controller(this.service);
    ${options.websocket ? `this.websocket = new ${className}WebSocket();` : ''}
  }

  get routes(): PluginRoute[] {
    return ${pluginName}Routes(this.controller);
  }

  async init(): Promise<void> {
    console.log(\`🔌 Inicializando plugin \${this.metadata.name}...\`);
    
    // Inicializar serviços
    await this.service.init();
    
    ${options.websocket ? `// Inicializar WebSocket
    await this.websocket.init();` : ''}
    
    console.log(\`✅ Plugin \${this.metadata.name} inicializado com sucesso\`);
  }

  async shutdown(): Promise<void> {
    console.log(\`🔌 Finalizando plugin \${this.metadata.name}...\`);
    
    // Cleanup
    await this.service.cleanup();
    
    ${options.websocket ? `// Finalizar WebSocket
    await this.websocket.cleanup();` : ''}
    
    console.log(\`✅ Plugin \${this.metadata.name} finalizado\`);
  }

  hooks = {
    beforeInit: async () => {
      console.log(\`📋 Plugin \${this.metadata.name}: executando beforeInit\`);
    },
    afterInit: async () => {
      console.log(\`📋 Plugin \${this.metadata.name}: executando afterInit\`);
    },
    beforeStart: async () => {
      console.log(\`📋 Plugin \${this.metadata.name}: executando beforeStart\`);
    },
    afterStart: async () => {
      console.log(\`📋 Plugin \${this.metadata.name}: executando afterStart\`);
    },
    beforeShutdown: async () => {
      console.log(\`📋 Plugin \${this.metadata.name}: executando beforeShutdown\`);
    }
  };
}

export default new ${className}Plugin();
`;
}