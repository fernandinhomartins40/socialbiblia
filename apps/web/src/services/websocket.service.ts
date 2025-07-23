import { io, Socket } from 'socket.io-client'
import { authService } from './auth.service'

export interface NotificationData {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export interface RealtimeEvent {
  type: string
  data: any
  timestamp: string
}

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  // Callbacks para eventos
  private eventCallbacks: { [key: string]: ((data: any) => void)[] } = {}

  // Conectar ao WebSocket
  connect(): void {
    if (this.socket?.connected) {
      return
    }

    const token = authService.getToken()
    if (!token) {
      console.warn('WebSocket: Sem token de autenticação')
      return
    }

    this.socket = io('/', {
      auth: {
        token,
      },
      transports: ['websocket'],
      upgrade: true,
    })

    this.setupEventListeners()
  }

  // Desconectar do WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Verificar se está conectado
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Configurar listeners de eventos do Socket.IO
  private setupEventListeners(): void {
    if (!this.socket) return

    // Evento de conexão
    this.socket.on('connect', () => {
      console.log('WebSocket conectado:', this.socket?.id)
      this.reconnectAttempts = 0
      this.triggerEvent('connected', { socketId: this.socket?.id })
    })

    // Evento de desconexão
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket desconectado:', reason)
      this.triggerEvent('disconnected', { reason })
      
      // Tentar reconectar se não foi desconexão manual
      if (reason !== 'io client disconnect') {
        this.handleReconnect()
      }
    })

    // Evento de erro
    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão WebSocket:', error)
      this.triggerEvent('error', { error: error.message })
      this.handleReconnect()
    })

    // Eventos customizados do Plugbase
    this.socket.on('notification', (data: NotificationData) => {
      this.triggerEvent('notification', data)
    })

    this.socket.on('user_update', (data: any) => {
      this.triggerEvent('user_update', data)
    })

    this.socket.on('post_created', (data: any) => {
      this.triggerEvent('post_created', data)
    })

    this.socket.on('post_updated', (data: any) => {
      this.triggerEvent('post_updated', data)
    })

    this.socket.on('post_deleted', (data: any) => {
      this.triggerEvent('post_deleted', data)
    })

    // Evento genérico para dados em tempo real
    this.socket.on('realtime_data', (data: RealtimeEvent) => {
      this.triggerEvent('realtime_data', data)
      this.triggerEvent(data.type, data.data)
    })
  }

  // Lidar com tentativas de reconexão
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido')
      this.triggerEvent('max_reconnect_attempts', {})
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Tentativa de reconexão ${this.reconnectAttempts} em ${delay}ms`)
    
    setTimeout(() => {
      if (!this.socket?.connected) {
        this.connect()
      }
    }, delay)
  }

  // Emitir evento para o servidor
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('WebSocket não conectado. Evento não enviado:', event)
    }
  }

  // Registrar callback para evento
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = []
    }
    this.eventCallbacks[event].push(callback)
  }

  // Remover callback de evento
  off(event: string, callback?: (data: any) => void): void {
    if (!this.eventCallbacks[event]) return

    if (callback) {
      this.eventCallbacks[event] = this.eventCallbacks[event].filter(cb => cb !== callback)
    } else {
      delete this.eventCallbacks[event]
    }
  }

  // Disparar evento para callbacks registrados
  private triggerEvent(event: string, data: any): void {
    const callbacks = this.eventCallbacks[event] || []
    callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Erro ao executar callback para evento ${event}:`, error)
      }
    })
  }

  // Entrar em uma sala (room)
  joinRoom(room: string): void {
    this.emit('join_room', { room })
  }

  // Sair de uma sala (room)
  leaveRoom(room: string): void {
    this.emit('leave_room', { room })
  }

  // Enviar mensagem para uma sala
  sendToRoom(room: string, event: string, data: any): void {
    this.emit('room_message', { room, event, data })
  }

  // Marcar notificação como lida
  markNotificationAsRead(notificationId: string): void {
    this.emit('mark_notification_read', { id: notificationId })
  }

  // Solicitar notificações não lidas
  requestUnreadNotifications(): void {
    this.emit('get_unread_notifications')
  }
}

// Instância singleton do serviço WebSocket
export const webSocketService = new WebSocketService()

// Auto-conectar quando há token disponível
if (authService.isAuthenticated()) {
  webSocketService.connect()
}