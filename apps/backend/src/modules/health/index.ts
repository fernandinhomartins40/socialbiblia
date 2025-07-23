import { Plugin } from '../../types/plugin';
import { healthRouter } from './health.routes';
import { Logger } from '../../utils/logger';

const healthPlugin: Plugin = {
  metadata: {
    name: 'health',
    version: '1.0.0',
    description: 'Health checks, métricas e monitoramento do sistema',
    author: 'Plugbase Team',
    enabled: true,
    priority: 0, // Prioridade máxima - carrega primeiro
  },
  
  routes: [
    {
      path: '/api/health',
      router: healthRouter,
    },
  ],
  
  hooks: {
    beforeInit: async () => {
      Logger.info('⚡ Inicializando plugin de health check...');
    },
    
    afterInit: async () => {
      Logger.info('✅ Plugin de health check inicializado com sucesso');
    },
    
    beforeShutdown: async () => {
      Logger.info('⚡ Desligando plugin de health check...');
    },
  },
  
  async init() {
    Logger.info('💓 Sistema de monitoramento ativo');
  },
  
  async shutdown() {
    Logger.info('⚡ Plugin de health check desligado');
  },
};

export default healthPlugin;