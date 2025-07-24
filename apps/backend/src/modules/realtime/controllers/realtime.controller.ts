import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth';
import { RealtimeService } from '../services/realtime.service';
import { Logger } from '../../../utils/logger';
import { ApiResponse } from '../../../types/api';

export class RealtimeController {
  constructor(private realtimeService: RealtimeService) {}

  // GET /api/realtime/stats
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = this.realtimeService.getRealtimeStats();

      const response: ApiResponse = {
        success: true,
        data: stats
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao buscar estatísticas do realtime:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/realtime/channels
  async getChannels(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const channels = this.realtimeService.getActiveChannels();

      const response: ApiResponse = {
        success: true,
        data: { channels }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao buscar canais ativos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/realtime/channels/:channel/subscribers
  async getChannelSubscribers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { channel } = req.params;
      const subscribers = this.realtimeService.getChannelSubscribers(channel);

      const response: ApiResponse = {
        success: true,
        data: { 
          channel, 
          subscribers,
          count: subscribers.length
        }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao buscar subscribers do canal:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/realtime/broadcast
  async broadcast(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { event, data, options = {} } = req.body;

      if (!event) {
        res.status(400).json({
          success: false,
          error: 'Campo "event" é obrigatório'
        });
        return;
      }

      await this.realtimeService.broadcastMessage(event, data, options);

      const response: ApiResponse = {
        success: true,
        message: 'Broadcast enviado com sucesso',
        data: { event, options }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao enviar broadcast:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/realtime/notification
  async sendNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, title, message, type, action } = req.body;

      if (!userId || !title || !message) {
        res.status(400).json({
          success: false,
          error: 'Campos "userId", "title" e "message" são obrigatórios'
        });
        return;
      }

      await this.realtimeService.sendNotification(userId, {
        title,
        message,
        type,
        action
      });

      const response: ApiResponse = {
        success: true,
        message: 'Notificação enviada com sucesso',
        data: { userId, title }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao enviar notificação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/realtime/data-update
  async sendDataUpdate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { channel, entityType, operation, data } = req.body;

      if (!channel || !entityType || !operation) {
        res.status(400).json({
          success: false,
          error: 'Campos "channel", "entityType" e "operation" são obrigatórios'
        });
        return;
      }

      if (!['create', 'update', 'delete'].includes(operation)) {
        res.status(400).json({
          success: false,
          error: 'Campo "operation" deve ser "create", "update" ou "delete"'
        });
        return;
      }

      await this.realtimeService.sendDataUpdate(channel, entityType, operation, data);

      const response: ApiResponse = {
        success: true,
        message: 'Atualização de dados enviada com sucesso',
        data: { channel, entityType, operation }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao enviar atualização de dados:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/realtime/chat
  async sendChatMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { room, message: messageText } = req.body;
      const userId = req.user?.id;
      const username = req.user?.email || 'Usuário';

      if (!room || !messageText) {
        res.status(400).json({
          success: false,
          error: 'Campos "room" e "message" são obrigatórios'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      await this.realtimeService.sendChatMessage(room, {
        userId,
        username,
        message: messageText
      });

      const response: ApiResponse = {
        success: true,
        message: 'Mensagem de chat enviada com sucesso',
        data: { room, userId }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao enviar mensagem de chat:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/realtime/user-status
  async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      if (!status || !['online', 'offline', 'away'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Campo "status" deve ser "online", "offline" ou "away"'
        });
        return;
      }

      await this.realtimeService.updateUserStatus(userId, status);

      const response: ApiResponse = {
        success: true,
        message: 'Status do usuário atualizado com sucesso',
        data: { userId, status }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao atualizar status do usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/realtime/progress
  async sendProgressUpdate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { taskId, percentage, message, completed, error: taskError } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      if (!taskId || percentage === undefined) {
        res.status(400).json({
          success: false,
          error: 'Campos "taskId" e "percentage" são obrigatórios'
        });
        return;
      }

      await this.realtimeService.sendProgressUpdate(userId, taskId, {
        percentage,
        message,
        completed,
        error: taskError
      });

      const response: ApiResponse = {
        success: true,
        message: 'Atualização de progresso enviada com sucesso',
        data: { userId, taskId, percentage }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao enviar atualização de progresso:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/realtime/test
  async getTestPage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const html = this.generateTestHTML();
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      Logger.error('Erro ao gerar página de teste:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  private generateTestHTML(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plugbase WebSocket Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">WebSocket Test Page</h1>
        
        <!-- Connection Status -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Status da Conexão</h2>
            <div id="status" class="text-red-600">Desconectado</div>
            <button id="connect-btn" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Conectar</button>
            <button id="disconnect-btn" class="mt-4 bg-red-600 text-white px-4 py-2 rounded ml-2" disabled>Desconectar</button>
        </div>

        <!-- Test Actions -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Ações de Teste</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button id="test-broadcast" class="bg-green-600 text-white px-4 py-2 rounded">Test Broadcast</button>
                <button id="test-notification" class="bg-yellow-600 text-white px-4 py-2 rounded">Test Notification</button>
                <button id="test-data-update" class="bg-purple-600 text-white px-4 py-2 rounded">Test Data Update</button>
            </div>
        </div>

        <!-- Messages -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Mensagens Recebidas</h2>
            <div id="messages" class="space-y-2 max-h-96 overflow-y-auto">
                <!-- Mensagens aparecerão aqui -->
            </div>
        </div>
    </div>

    <script>
        let socket = null;
        const statusEl = document.getElementById('status');
        const messagesEl = document.getElementById('messages');
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');

        function addMessage(type, data) {
            const messageEl = document.createElement('div');
            messageEl.className = 'p-3 bg-gray-50 rounded border-l-4 border-blue-500';
            messageEl.innerHTML = \`
                <div class="font-semibold">\${type}</div>
                <div class="text-sm text-gray-600">\${new Date().toLocaleTimeString()}</div>
                <div class="mt-2"><pre>\${JSON.stringify(data, null, 2)}</pre></div>
            \`;
            messagesEl.appendChild(messageEl);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function connect() {
            socket = io({
                auth: {
                    token: localStorage.getItem('token') // Se tiver token JWT
                }
            });

            socket.on('connect', () => {
                statusEl.textContent = 'Conectado';
                statusEl.className = 'text-green-600';
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
                addMessage('Connected', { socketId: socket.id });
            });

            socket.on('disconnect', () => {
                statusEl.textContent = 'Desconectado';
                statusEl.className = 'text-red-600';
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
                addMessage('Disconnected', {});
            });

            // Eventos específicos
            socket.on('connected', (data) => {
                addMessage('Server Connected', data);
            });

            socket.on('notification', (data) => {
                addMessage('Notification', data);
            });

            socket.on('data_update', (data) => {
                addMessage('Data Update', data);
            });

            socket.on('chat_message', (data) => {
                addMessage('Chat Message', data);
            });

            socket.on('user_status', (data) => {
                addMessage('User Status', data);
            });

            socket.on('task_progress', (data) => {
                addMessage('Task Progress', data);
            });

            // Evento genérico
            socket.onAny((event, data) => {
                if (!['connect', 'disconnect', 'connected', 'notification', 'data_update', 'chat_message', 'user_status', 'task_progress'].includes(event)) {
                    addMessage('Generic Event: ' + event, data);
                }
            });
        }

        function disconnect() {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        }

        // Event listeners
        connectBtn.addEventListener('click', connect);
        disconnectBtn.addEventListener('click', disconnect);

        // Test buttons
        document.getElementById('test-broadcast').addEventListener('click', async () => {
            try {
                const response = await fetch('/api/realtime/broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'test_broadcast',
                        data: { message: 'Hello from test page!', timestamp: new Date().toISOString() }
                    })
                });
                const result = await response.json();
                addMessage('Broadcast Sent', result);
            } catch (error) {
                addMessage('Error', error.message);
            }
        });

        document.getElementById('test-notification').addEventListener('click', async () => {
            try {
                const response = await fetch('/api/realtime/notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: 'test-user',
                        title: 'Test Notification',
                        message: 'This is a test notification from the test page',
                        type: 'info'
                    })
                });
                const result = await response.json();
                addMessage('Notification Sent', result);
            } catch (error) {
                addMessage('Error', error.message);
            }
        });

        document.getElementById('test-data-update').addEventListener('click', async () => {
            try {
                const response = await fetch('/api/realtime/data-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channel: 'test-channel',
                        entityType: 'test-entity',
                        operation: 'update',
                        data: { id: 1, name: 'Updated Entity', timestamp: new Date().toISOString() }
                    })
                });
                const result = await response.json();
                addMessage('Data Update Sent', result);
            } catch (error) {
                addMessage('Error', error.message);
            }
        });

        // Auto-connect on page load
        connect();
    </script>
</body>
</html>`;
  }
}
