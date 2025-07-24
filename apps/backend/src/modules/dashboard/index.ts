import { Plugin, PluginRoute } from '../../types/plugin';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { dashboardRoutes } from './routes/dashboard.routes';

class DashboardPlugin implements Plugin {
  metadata = {
    name: 'dashboard',
    version: '1.0.0',
    description: 'Dashboard visual para gerenciar plugins do Plugbase',
    dependencies: [],
    enabled: false, // Temporariamente desabilitado para deploy
    priority: 5 // Alta prioridade para carregar cedo
  };

  private controller: DashboardController;
  private service: DashboardService;

  constructor() {
    this.service = new DashboardService();
    this.controller = new DashboardController(this.service);
  }

  get routes(): PluginRoute[] {
    return dashboardRoutes(this.controller);
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

export default new DashboardPlugin();