import { Plugin, PluginRoute } from '../../types/plugin';
import { RealtimeController } from './controllers/realtime.controller';
import { RealtimeService } from './services/realtime.service';
import { realtimeRoutes } from './routes/realtime.routes';

class RealtimePlugin implements Plugin {
  metadata = {
    name: 'realtime',
    version: '1.0.0',
    description: 'Plugin para funcionalidades em tempo real com WebSocket',
    dependencies: [],
    enabled: true,
    priority: 3 // Alta prioridade para inicializar cedo
  };

  private controller: RealtimeController;
  private service: RealtimeService;

  constructor() {
    this.service = new RealtimeService();
    this.controller = new RealtimeController(this.service);
  }

  get routes(): PluginRoute[] {
    return realtimeRoutes(this.controller);
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

export default new RealtimePlugin();