import { PluginRoute } from '../../../types/plugin';
import { RealtimeController } from '../controllers/realtime.controller';
import { authenticate } from '../../../middleware/auth';

export function realtimeRoutes(controller: RealtimeController): PluginRoute[] {
  return [
    // Página de teste do WebSocket
    {
      method: 'GET',
      path: '/realtime/test',
      handler: controller.getTestPage.bind(controller),
      middleware: []
    },

    // Estatísticas do WebSocket
    {
      method: 'GET',
      path: '/api/realtime/stats',
      handler: controller.getStats.bind(controller),
      middleware: []
    },

    // Listar canais ativos
    {
      method: 'GET',
      path: '/api/realtime/channels',
      handler: controller.getChannels.bind(controller),
      middleware: []
    },

    // Listar subscribers de um canal
    {
      method: 'GET',
      path: '/api/realtime/channels/:channel/subscribers',
      handler: controller.getChannelSubscribers.bind(controller),
      middleware: []
    },

    // Broadcast genérico
    {
      method: 'POST',
      path: '/api/realtime/broadcast',
      handler: controller.broadcast.bind(controller),
      middleware: []
    },

    // Enviar notificação
    {
      method: 'POST',
      path: '/api/realtime/notification',
      handler: controller.sendNotification.bind(controller),
      middleware: []
    },

    // Enviar atualização de dados
    {
      method: 'POST',
      path: '/api/realtime/data-update',
      handler: controller.sendDataUpdate.bind(controller),
      middleware: []
    },

    // Enviar mensagem de chat (requer autenticação)
    {
      method: 'POST',
      path: '/api/realtime/chat',
      handler: controller.sendChatMessage.bind(controller),
      middleware: [authenticate]
    },

    // Atualizar status do usuário (requer autenticação)
    {
      method: 'POST',
      path: '/api/realtime/user-status',
      handler: controller.updateUserStatus.bind(controller),
      middleware: [authenticate]
    },

    // Enviar atualização de progresso (requer autenticação)
    {
      method: 'POST',
      path: '/api/realtime/progress',
      handler: controller.sendProgressUpdate.bind(controller),
      middleware: [authenticate]
    }
  ];
}