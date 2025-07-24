import { Logger } from '../../../utils/logger';
import { webSocketManager, PluginWebSocket } from '../../../core/websocket';

interface SubscriptionOptions {
  channels?: string[];
  rooms?: string[];
  userId?: string;
}

interface BroadcastOptions {
  channel?: string;
  room?: string;
  userId?: string;
  exclude?: string[];
}

export class RealtimeService extends PluginWebSocket {
  private subscriptions: Map<string, Set<string>> = new Map();
  private userChannels: Map<string, Set<string>> = new Map();

  async init(): Promise<void> {
    Logger.info(`Inicializando ${this.constructor.name}...`);
    
    // Configurar eventos personalizados do WebSocket
    this.setupWebSocketEvents();
    
    Logger.info(`${this.constructor.name} inicializado com sucesso`);
  }

  async cleanup(): Promise<void> {
    Logger.info(`Finalizando ${this.constructor.name}...`);
    
    this.subscriptions.clear();
    this.userChannels.clear();
  }

  private setupWebSocketEvents(): void {
    // Aqui podemos adicionar listeners customizados se necessário
    Logger.debug('Eventos WebSocket configurados para o plugin realtime');
  }

  // Gerenciar subscriptions
  async subscribe(connectionId: string, options: SubscriptionOptions): Promise<void> {
    try {
      if (options.channels) {
        for (const channel of options.channels) {
          if (!this.subscriptions.has(channel)) {
            this.subscriptions.set(channel, new Set());
          }
          this.subscriptions.get(channel)!.add(connectionId);
        }
      }

      if (options.userId && options.channels) {
        if (!this.userChannels.has(options.userId)) {
          this.userChannels.set(options.userId, new Set());
        }
        for (const channel of options.channels) {
          this.userChannels.get(options.userId)!.add(channel);
        }
      }

      Logger.debug(`Subscription criada para conexão ${connectionId}`, options);
    } catch (error) {
      Logger.error('Erro ao criar subscription:', error);
      throw error;
    }
  }

  async unsubscribe(connectionId: string, channels?: string[]): Promise<void> {
    try {
      if (channels) {
        for (const channel of channels) {
          this.subscriptions.get(channel)?.delete(connectionId);
          if (this.subscriptions.get(channel)?.size === 0) {
            this.subscriptions.delete(channel);
          }
        }
      } else {
        // Remover de todos os canais
        for (const [channel, connections] of this.subscriptions) {
          connections.delete(connectionId);
          if (connections.size === 0) {
            this.subscriptions.delete(channel);
          }
        }
      }

      Logger.debug(`Subscription removida para conexão ${connectionId}`, { channels });
    } catch (error) {
      Logger.error('Erro ao remover subscription:', error);
      throw error;
    }
  }

  // Broadcast com opções avançadas
  async broadcastMessage(event: string, data: any, options: BroadcastOptions = {}): Promise<void> {
    try {
      const message = {
        event,
        data,
        timestamp: new Date().toISOString(),
        source: 'realtime-plugin'
      };

      if (options.channel) {
        this.broadcastToChannel(options.channel, event, message);
      } else if (options.room) {
        this.broadcastToRoom(options.room, event, message);
      } else if (options.userId) {
        this.broadcastToUser(options.userId, event, message);
      } else {
        this.broadcast(event, message);
      }

      Logger.debug(`Mensagem broadcast enviada:`, { event, options });
    } catch (error) {
      Logger.error('Erro ao enviar broadcast:', error);
      throw error;
    }
  }

  // Funcionalidades específicas para plugins

  // Notificações em tempo real
  async sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    action?: { label: string; url: string };
  }): Promise<void> {
    await this.broadcastMessage('notification', {
      ...notification,
      type: notification.type || 'info'
    }, { userId });
  }

  // Atualizações de dados em tempo real
  async sendDataUpdate(channel: string, entityType: string, operation: 'create' | 'update' | 'delete', data: any): Promise<void> {
    await this.broadcastMessage('data_update', {
      entityType,
      operation,
      data
    }, { channel });
  }

  // Chat/mensagens em tempo real
  async sendChatMessage(room: string, message: {
    userId: string;
    username: string;
    message: string;
    timestamp?: string;
  }): Promise<void> {
    await this.broadcastMessage('chat_message', {
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    }, { room });
  }

  // Status de usuário online/offline
  async updateUserStatus(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    await this.broadcastMessage('user_status', {
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Progresso de tarefas em tempo real
  async sendProgressUpdate(userId: string, taskId: string, progress: {
    percentage: number;
    message?: string;
    completed?: boolean;
    error?: string;
  }): Promise<void> {
    await this.broadcastMessage('task_progress', {
      taskId,
      ...progress
    }, { userId });
  }

  // Estatísticas em tempo real
  getRealtimeStats() {
    const wsStats = webSocketManager.getStats();
    
    return {
      ...wsStats,
      subscriptions: {
        totalChannels: this.subscriptions.size,
        channels: Array.from(this.subscriptions.entries()).map(([channel, connections]) => ({
          channel,
          subscribers: connections.size
        }))
      },
      userChannels: {
        totalUsers: this.userChannels.size,
        totalMappings: Array.from(this.userChannels.values()).reduce((sum, channels) => sum + channels.size, 0)
      }
    };
  }

  // Listar canais ativos
  getActiveChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // Listar usuários em um canal
  getChannelSubscribers(channel: string): string[] {
    const connections = this.subscriptions.get(channel);
    return connections ? Array.from(connections) : [];
  }

  // Verificar se usuário está subscrito a um canal
  isUserSubscribed(userId: string, channel: string): boolean {
    const userChannels = this.userChannels.get(userId);
    return userChannels ? userChannels.has(channel) : false;
  }
}
