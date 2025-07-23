import { Plugin } from '../../types/plugin';
import { productsRouter } from './products.routes';
import { ProductsDatabase } from './database';
import { Logger } from '../../utils/logger';
import { createContentLimiter } from '../../middleware/rateLimiting';

const productsPlugin: Plugin = {
  metadata: {
    name: 'products',
    version: '1.0.0',
    description: 'Sistema completo de produtos com schema modular e database independente',
    author: 'Plugbase Team',
    dependencies: ['auth'], // Precisa de autenticação para criar produtos
    enabled: true,
    priority: 4, // Carrega após auth, users, posts
  },
  
  routes: [
    {
      path: '/api/products',
      router: productsRouter,
      middleware: [createContentLimiter], // Rate limiting específico para criação
    },
  ],
  
  hooks: {
    beforeInit: async () => {
      Logger.info('🛍️ Plugin Products: Inicializando...');
      
      // Conectar ao banco (usa a mesma conexão Prisma, mas queries específicas)
      await ProductsDatabase.connect();
      Logger.info('🛍️ Plugin Products: Conexão com banco estabelecida');
    },
    
    afterInit: async () => {
      Logger.info('🛍️ Plugin Products: Executando migrations...');
      
      // Executar migrations específicas do plugin
      await ProductsDatabase.runMigrations();
      Logger.info('🛍️ Plugin Products: Migrations executadas com sucesso');
      
      Logger.info('✅ Plugin Products: Inicializado com sucesso');
    },
    
    beforeStart: async (app) => {
      Logger.info('🛍️ Plugin Products: Configurando middleware adicional...');
      
      // Aqui poderia configurar middleware adicional específico do plugin
      // Por exemplo, middleware para upload de imagens de produtos
    },
    
    afterStart: async (app) => {
      Logger.info('🛍️ Plugin Products: Sistema ativo');
      Logger.info('🛍️ Plugin Products: Rotas disponíveis:', {
        routes: [
          'GET /api/products - Listar produtos',
          'GET /api/products/my - Meus produtos',
          'GET /api/products/featured - Produtos em destaque',
          'GET /api/products/stats - Estatísticas (Admin)',
          'GET /api/products/:id - Buscar por ID',
          'GET /api/products/slug/:slug - Buscar por slug',
          'GET /api/products/:id/related - Produtos relacionados',
          'POST /api/products - Criar produto',
          'PUT /api/products/:id - Atualizar produto',
          'DELETE /api/products/:id - Deletar produto',
        ],
      });
    },
    
    beforeShutdown: async () => {
      Logger.info('🛍️ Plugin Products: Desligando...');
      
      // Desconectar do banco
      await ProductsDatabase.disconnect();
      Logger.info('🛍️ Plugin Products: Desconectado do banco');
    },
  },
  
  async init() {
    Logger.info('🛍️ Plugin Products: Configuração inicial...');
    
    // Verificar configurações específicas do plugin
    const config = {
      maxImagesPerProduct: parseInt(process.env.MAX_IMAGES_PER_PRODUCT || '10'),
      maxVariantsPerProduct: parseInt(process.env.MAX_VARIANTS_PER_PRODUCT || '50'),
      defaultStatus: process.env.DEFAULT_PRODUCT_STATUS || 'draft',
      enableInventoryTracking: process.env.ENABLE_INVENTORY_TRACKING === 'true',
      enableProductVariants: process.env.ENABLE_PRODUCT_VARIANTS !== 'false',
    };
    
    Logger.info('🛍️ Plugin Products: Configuração aplicada', config);
    
    // Aqui poderia inicializar serviços específicos do plugin
    // Por exemplo, integração com serviços externos de estoque
  },
  
  async shutdown() {
    Logger.info('🛍️ Plugin Products: Limpeza final...');
    
    // Aqui faria limpezas específicas do plugin
    // Por exemplo, cancelar jobs de sincronização de estoque
    
    Logger.info('🛍️ Plugin Products: Desligado com sucesso');
  },
};

export default productsPlugin;