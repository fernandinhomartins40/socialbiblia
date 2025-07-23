import { Plugin } from '../../types/plugin';
import { postsRouter } from './posts.routes';
import { Logger } from '../../utils/logger';
import { createContentLimiter } from '../../middleware/rateLimiting';

const postsPlugin: Plugin = {
  metadata: {
    name: 'posts',
    version: '1.0.0',
    description: 'Sistema de posts com filtros avançados e cache',
    author: 'Plugbase Team',
    dependencies: ['auth', 'users'],
    enabled: true,
    priority: 3,
  },
  
  routes: [
    {
      path: '/api/posts',
      router: postsRouter,
      middleware: [createContentLimiter], // Rate limiting específico para posts
    },
  ],
  
  hooks: {
    beforeInit: async () => {
      Logger.info('📝 Inicializando plugin de posts...');
    },
    
    afterInit: async () => {
      Logger.info('✅ Plugin de posts inicializado com sucesso');
    },
    
    beforeShutdown: async () => {
      Logger.info('📝 Desligando plugin de posts...');
    },
  },
  
  async init() {
    Logger.info('📄 Sistema de posts configurado com cache e filtros');
  },
  
  async shutdown() {
    // Limpar cache de posts se necessário
    Logger.info('📝 Plugin de posts desligado');
  },
};

export default postsPlugin;