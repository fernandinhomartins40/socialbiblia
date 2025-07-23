import { createServer } from './core/server';
import { config } from './core/config';
import router from './core/router';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { notFoundHandler } from './middleware/notFoundHandler';
import { staticFiles } from './middleware/static-files';
import { cache } from './utils/cache';
import { specs, swaggerUi, swaggerUiOptions } from './utils/swagger';
import { PluginManager } from './core/plugin-manager';
import { Logger } from './utils/logger';
import { webSocketManager } from './core/websocket';
import { createServer as createHttpServer } from 'http';

async function startServer() {
  try {
    Logger.info('🚀 Iniciando Plugbase Backend...');
    
    // Connect to cache
    await cache.connect();
    
    // Initialize plugin system
    const pluginManager = PluginManager.getInstance();
    
    Logger.info('🔍 Descobrindo plugins...');
    await pluginManager.discoverPlugins();
    
    Logger.info('⚙️ Inicializando plugins...');
    await pluginManager.initializePlugins();
    
    const app = createServer();

    // Add request logging
    app.use(requestLogger);

    // Serve static files (uploads)
    app.use(staticFiles);

    // Add Swagger documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
    
    // Register plugin routes dynamically
    Logger.info('🔗 Registrando rotas dos plugins...');
    await pluginManager.registerRoutes(app);
    
    // Add core routes
    app.use(router);

    // Add 404 handler
    app.use(notFoundHandler);

    // Add error handler (must be last)
    app.use(errorHandler);

    // Start server with WebSocket support
    const port = config.server.port;
    const httpServer = createHttpServer(app);
    
    // Initialize WebSocket
    Logger.info('🔌 Inicializando WebSocket...');
    webSocketManager.init(httpServer);
    
    httpServer.listen(port, async () => {
      Logger.info(`🚀 ${config.server.appName} rodando na porta ${port}`);
      Logger.info(`📊 Health check: http://localhost:${port}/health`);
      Logger.info(`📚 API info: http://localhost:${port}/api`);
      Logger.info(`📖 API docs: http://localhost:${port}/api-docs`);
      Logger.info(`🔌 Plugin info: http://localhost:${port}/api/plugins/info`);
      Logger.info(`🌐 Dashboard: http://localhost:${port}/dashboard`);
      Logger.info(`🔄 WebSocket Test: http://localhost:${port}/realtime/test`);
      
      const loadedPlugins = pluginManager.getPluginInfo();
      Logger.info(`✅ ${loadedPlugins.length} plugins carregados:`, {
        plugins: loadedPlugins.map(p => `${p.name} v${p.version}`),
      });
      
      // Start plugins
      await pluginManager.startPlugins(app);
      
      if (config.server.nodeEnv === 'development') {
        Logger.info(`🔧 Modo desenvolvimento ativado`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      Logger.info('SIGTERM recebido, desligando servidor...');
      await pluginManager.shutdownPlugins();
      await cache.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      Logger.info('SIGINT recebido, desligando servidor...');
      await pluginManager.shutdownPlugins();
      await cache.disconnect();
      process.exit(0);
    });

  } catch (error) {
    Logger.error('Erro ao iniciar servidor:', error as Error);
    await cache.disconnect();
    process.exit(1);
  }
}

// Start the server
startServer();
