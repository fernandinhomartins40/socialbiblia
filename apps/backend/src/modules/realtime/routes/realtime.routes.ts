import { Router } from 'express';
import { PluginRoute } from '../../../types/plugin';
import { RealtimeController } from '../controllers/realtime.controller';
import { authenticate } from '../../../core/middlewares';

export function realtimeRoutes(controller: RealtimeController): PluginRoute[] {
  const router = Router();
  
  // Página de teste do WebSocket
  router.get('/realtime/test', controller.getTestPage.bind(controller));
  
  // Estatísticas do WebSocket
  router.get('/api/realtime/stats', controller.getStats.bind(controller));
  
  // Listar canais ativos
  router.get('/api/realtime/channels', controller.getChannels.bind(controller));
  
  // Listar subscribers de um canal
  router.get('/api/realtime/channels/:channel/subscribers', controller.getChannelSubscribers.bind(controller));
  
  // Broadcast genérico
  router.post('/api/realtime/broadcast', controller.broadcast.bind(controller));
  
  // Enviar notificação
  router.post('/api/realtime/notification', controller.sendNotification.bind(controller));
  
  // Enviar atualização de dados
  router.post('/api/realtime/data-update', controller.sendDataUpdate.bind(controller));
  
  // Enviar mensagem de chat (requer autenticação)
  router.post('/api/realtime/chat', authenticate, controller.sendChatMessage.bind(controller));
  
  // Atualizar status do usuário (requer autenticação)
  router.post('/api/realtime/user-status', authenticate, controller.updateUserStatus.bind(controller));
  
  // Enviar atualização de progresso (requer autenticação)
  router.post('/api/realtime/progress', authenticate, controller.sendProgressUpdate.bind(controller));
  
  return [
    {
      path: '/',
      router,
    }
  ];
}