import { Plugin } from '../../types/plugin';
import { authRouter } from './auth.routes';
import { Logger } from '../../utils/logger';

const authPlugin: Plugin = {
  metadata: {
    name: 'auth',
    version: '1.0.0',
    description: 'Sistema de autenticação JWT com refresh tokens',
    author: 'Plugbase Team',
    enabled: true,
    priority: 1, // Alta prioridade - carrega primeiro
  },
  
  routes: [
    {
      path: '/api/auth',
      router: authRouter,
    },
  ],
  
  hooks: {
    beforeInit: async () => {
      Logger.info('🔐 Inicializando plugin de autenticação...');
    },
    
    afterInit: async () => {
      Logger.info('✅ Plugin de autenticação inicializado com sucesso');
    },
    
    beforeShutdown: async () => {
      Logger.info('🔐 Desligando plugin de autenticação...');
    },
  },
  
  async init() {
    // Inicialização específica do plugin
    // Verificar se JWT secrets estão configurados
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado para o plugin de autenticação');
    }
    
    Logger.info('🔑 JWT configurado para autenticação');
  },
  
  async shutdown() {
    // Limpeza específica do plugin
    Logger.info('🔐 Plugin de autenticação desligado');
  },
};

export default authPlugin;