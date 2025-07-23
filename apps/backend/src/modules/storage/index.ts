import { Plugin, PluginRoute } from '../../types/plugin';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { storageRoutes } from './routes/storage.routes';

class StoragePlugin implements Plugin {
  metadata = {
    name: 'storage',
    version: '1.0.0',
    description: 'Plugin de armazenamento de arquivos com suporte a múltiplos provedores',
    dependencies: [],
    enabled: true,
    priority: 8
  };

  private controller: StorageController;
  private service: StorageService;

  constructor() {
    this.service = new StorageService();
    this.controller = new StorageController(this.service);
  }

  get routes(): PluginRoute[] {
    return storageRoutes(this.controller);
  }

  async init(): Promise<void> {
    console.log(`🔌 Inicializando plugin ${this.metadata.name}...`);
    
    await this.service.init();
    
    console.log(`✅ Plugin ${this.metadata.name} inicializado com sucesso`);
  }

  async shutdown(): Promise<void> {
    console.log(`🔌 Finalizando plugin ${this.metadata.name}...`);
    
    await this.service.cleanup();
    
    console.log(`✅ Plugin ${this.metadata.name} finalizado`);
  }

  hooks = {
    beforeInit: async () => {
      console.log(`📋 Plugin ${this.metadata.name}: executando beforeInit`);
    },
    afterInit: async () => {
      console.log(`📋 Plugin ${this.metadata.name}: executando afterInit`);
    },
    beforeStart: async () => {
      console.log(`📋 Plugin ${this.metadata.name}: executando beforeStart`);
    },
    afterStart: async () => {
      console.log(`📋 Plugin ${this.metadata.name}: executando afterStart`);
    },
    beforeShutdown: async () => {
      console.log(`📋 Plugin ${this.metadata.name}: executando beforeShutdown`);
    }
  };
}

export default new StoragePlugin();