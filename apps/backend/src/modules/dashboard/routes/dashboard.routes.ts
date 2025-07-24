import { Router } from 'express';
import { PluginRoute } from '../../../types/plugin';
import { DashboardController } from '../controllers/dashboard.controller';

export function dashboardRoutes(controller: DashboardController): PluginRoute[] {
  const router = Router();
  
  // Dashboard principal (API + UI)
  router.get('/dashboard', controller.getDashboardUI.bind(controller));
  
  // API para dados do dashboard
  router.get('/api/dashboard', controller.getDashboard.bind(controller));
       
   // API para lista de plugins
   router.get('/api/dashboard/plugins', controller.getPlugins.bind(controller));
   
   // API para estatísticas
   router.get('/api/dashboard/stats', controller.getStats.bind(controller));
   
   // API para habilitar/desabilitar plugin
   router.post('/api/dashboard/plugins/:name/toggle', controller.togglePlugin.bind(controller));
   
   // API para executar migrations
   router.post('/api/dashboard/migrations/run', controller.runMigrations.bind(controller));
   
   return [
     {
       path: '/',
       router,
     }
   ];
}