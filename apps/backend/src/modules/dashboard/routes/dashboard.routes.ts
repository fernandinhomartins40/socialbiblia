import { PluginRoute } from '../../../types/plugin';
import { DashboardController } from '../controllers/dashboard.controller';

export function dashboardRoutes(controller: DashboardController): PluginRoute[] {
  return [
    // Dashboard principal (API + UI)
    {
      method: 'GET',
      path: '/dashboard',
      handler: controller.getDashboardUI.bind(controller),
      middleware: []
    },
    
    // API para dados do dashboard
    {
      method: 'GET',
      path: '/api/dashboard',
      handler: controller.getDashboard.bind(controller),
      middleware: []
    },
    
    // API para lista de plugins
    {
      method: 'GET',
      path: '/api/dashboard/plugins',
      handler: controller.getPlugins.bind(controller),
      middleware: []
    },
    
    // API para estatísticas
    {
      method: 'GET',
      path: '/api/dashboard/stats',
      handler: controller.getStats.bind(controller),
      middleware: []
    },
    
    // API para habilitar/desabilitar plugin
    {
      method: 'POST',
      path: '/api/dashboard/plugins/:name/toggle',
      handler: controller.togglePlugin.bind(controller),
      middleware: []
    },
    
    // API para executar migrations
    {
      method: 'POST',
      path: '/api/dashboard/migrations/run',
      handler: controller.runMigrations.bind(controller),
      middleware: []
    }
  ];
}