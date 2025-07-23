import { Router } from 'express';
import { PluginManager } from './plugin-manager';
import { ResponseUtil } from '../utils/responses';

const router = Router();

// API documentation endpoint
router.get('/api', (req, res) => {
  const pluginManager = PluginManager.getInstance();
  const loadedPlugins = pluginManager.getPluginInfo();
  
  const endpoints: Record<string, string> = {};
  const pluginRoutes: Record<string, any> = {};
  
  // Construir endpoints dinamicamente baseado nos plugins carregados
  for (const plugin of loadedPlugins) {
    endpoints[plugin.name] = `/api/${plugin.name}`;
    pluginRoutes[plugin.name] = {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      enabled: plugin.enabled,
      endpoint: `/api/${plugin.name}`,
    };
  }

  res.json(ResponseUtil.success({
    message: 'Plugbase Backend API - Sistema Plugável',
    version: '2.0.0',
    endpoints,
    plugins: pluginRoutes,
    documentation: '/api-docs',
    pluginInfo: `/api/plugins/info`,
  }, 'API Plugável ativa'));
});

// Endpoint para informações dos plugins
router.get('/api/plugins/info', (req, res) => {
  const pluginManager = PluginManager.getInstance();
  const pluginInfo = pluginManager.getPluginInfo();
  
  res.json(ResponseUtil.success({
    totalPlugins: pluginInfo.length,
    enabledPlugins: pluginInfo.filter(p => p.enabled).length,
    plugins: pluginInfo,
  }, 'Informações dos plugins'));
});

// Endpoint para gerenciar plugins (futuro - admin only)
router.post('/api/plugins/:pluginName/enable', (req, res) => {
  const { pluginName } = req.params;
  const pluginManager = PluginManager.getInstance();
  
  try {
    pluginManager.enablePlugin(pluginName);
    res.json(ResponseUtil.success(null, `Plugin ${pluginName} habilitado (reinicie para aplicar)`));
  } catch (error) {
    res.status(400).json(ResponseUtil.error('Erro ao habilitar plugin'));
  }
});

router.post('/api/plugins/:pluginName/disable', (req, res) => {
  const { pluginName } = req.params;
  const pluginManager = PluginManager.getInstance();
  
  try {
    pluginManager.disablePlugin(pluginName);
    res.json(ResponseUtil.success(null, `Plugin ${pluginName} desabilitado (reinicie para aplicar)`));
  } catch (error) {
    res.status(400).json(ResponseUtil.error('Erro ao desabilitar plugin'));
  }
});

export default router;
