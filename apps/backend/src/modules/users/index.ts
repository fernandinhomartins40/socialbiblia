import { Plugin } from '../../types/plugin';
import { usersRouter } from './users.routes';
import { Logger } from '../../utils/logger';

const usersPlugin: Plugin = {
  metadata: {
    name: 'users',
    version: '1.0.0',
    description: 'Gerenciamento completo de usuários com paginação e busca',
    author: 'Plugbase Team',
    dependencies: ['auth'], // Depende do plugin de auth
    enabled: true,
    priority: 2,
  },
  
  routes: [
    {
      path: '/api/users',
      router: usersRouter,
    },
  ],
  
  hooks: {
    beforeInit: async () => {
      Logger.info('👥 Inicializando plugin de usuários...');
    },
    
    afterInit: async () => {
      Logger.info('✅ Plugin de usuários inicializado com sucesso');
    },
    
    beforeShutdown: async () => {
      Logger.info('👥 Desligando plugin de usuários...');
    },
  },
  
  async init() {
    // Verificar dependências
    Logger.info('👤 Sistema de usuários configurado');
  },
  
  async shutdown() {
    Logger.info('👥 Plugin de usuários desligado');
  },
};

export default usersPlugin;