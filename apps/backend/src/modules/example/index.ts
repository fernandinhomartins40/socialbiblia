import { Router } from 'express';
import { Plugin } from '../../types/plugin';
import { Logger } from '../../utils/logger';
import { ResponseUtil } from '../../utils/responses';
import { authenticateToken } from '../../middleware/auth';

// Criar router para o plugin exemplo
const exampleRouter = Router();

exampleRouter.get('/', (req, res) => {
  res.json(ResponseUtil.success({
    message: 'Plugin exemplo funcionando!',
    timestamp: new Date().toISOString(),
    features: ['Dynamic loading', 'Hot reload', 'Dependency management'],
  }, 'Plugin exemplo ativo'));
});

exampleRouter.get('/protected', authenticateToken, (req, res) => {
  res.json(ResponseUtil.success({
    message: 'Rota protegida do plugin exemplo',
    user: (req as any).user,
  }, 'Acesso autorizado'));
});

exampleRouter.get('/info', (req, res) => {
  res.json(ResponseUtil.success({
    name: 'example',
    version: '1.0.0',
    description: 'Plugin de exemplo para demonstrar a arquitetura plugável',
    routes: [
      'GET /api/example - Informações básicas',
      'GET /api/example/protected - Rota protegida',
      'GET /api/example/info - Informações do plugin',
    ],
  }, 'Informações do plugin exemplo'));
});

const examplePlugin: Plugin = {
  metadata: {
    name: 'example',
    version: '1.0.0',
    description: 'Plugin de exemplo para demonstrar a arquitetura plugável',
    author: 'Plugbase Team',
    dependencies: ['auth'],
    enabled: true,
    priority: 10, // Baixa prioridade - carrega por último
  },
  
  routes: [
    {
      path: '/api/example',
      router: exampleRouter,
    },
  ],
  
  hooks: {
    beforeInit: async () => {
      Logger.info('🎯 Inicializando plugin de exemplo...');
    },
    
    afterInit: async () => {
      Logger.info('✅ Plugin de exemplo inicializado com sucesso');
    },
    
    afterStart: async (app) => {
      Logger.info('🎯 Plugin de exemplo: servidor iniciado, registrando rotas adicionais...');
      // Aqui poderia registrar rotas dinâmicas ou fazer outras configurações
    },
    
    beforeShutdown: async () => {
      Logger.info('🎯 Desligando plugin de exemplo...');
    },
  },
  
  async init() {
    Logger.info('🔧 Plugin de exemplo configurado com rotas dinâmicas');
    
    // Exemplo de inicialização específica do plugin
    const config = {
      enableFeatureX: true,
      maxItems: 100,
      cacheTimeout: 300000, // 5 minutos
    };
    
    Logger.info('🎯 Configuração do plugin exemplo:', config);
  },
  
  async shutdown() {
    Logger.info('🎯 Plugin de exemplo desligado - limpeza concluída');
  },
};

export default examplePlugin;