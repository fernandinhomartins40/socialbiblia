import { useEffect, useCallback, useState } from 'react'
import { webSocketService, NotificationData, RealtimeEvent } from '@/services/websocket.service'
import { usePlugbaseAuth } from './usePlugbaseAuth.tsx'

export function useWebSocket() {
  const { isAuthenticated } = usePlugbaseAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  // Conectar/desconectar baseado na autenticação
  useEffect(() => {
    if (isAuthenticated) {
      webSocketService.connect()
    } else {
      webSocketService.disconnect()
    }

    return () => {
      webSocketService.disconnect()
    }
  }, [isAuthenticated])

  // Monitorar status de conexão
  useEffect(() => {
    const handleConnected = () => setIsConnected(true)
    const handleDisconnected = () => setIsConnected(false)

    webSocketService.on('connected', handleConnected)
    webSocketService.on('disconnected', handleDisconnected)

    // Estado initial
    setIsConnected(webSocketService.isConnected())

    return () => {
      webSocketService.off('connected', handleConnected)
      webSocketService.off('disconnected', handleDisconnected)
    }
  }, [])

  // Gerenciar notificações
  useEffect(() => {
    const handleNotification = (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev])
    }

    webSocketService.on('notification', handleNotification)

    return () => {
      webSocketService.off('notification', handleNotification)
    }
  }, [])

  // Funções de interface
  const emit = useCallback((event: string, data?: any) => {
    webSocketService.emit(event, data)
  }, [])

  const joinRoom = useCallback((room: string) => {
    webSocketService.joinRoom(room)
  }, [])

  const leaveRoom = useCallback((room: string) => {
    webSocketService.leaveRoom(room)
  }, [])

  const markNotificationAsRead = useCallback((notificationId: string) => {
    webSocketService.markNotificationAsRead(notificationId)
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    isConnected,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    emit,
    joinRoom,
    leaveRoom,
    markNotificationAsRead,
    clearNotifications,
  }
}

// Hook para escutar eventos específicos
export function useWebSocketEvent<T = any>(
  event: string,
  callback: (data: T) => void,
  deps: any[] = []
) {
  useEffect(() => {
    webSocketService.on(event, callback)

    return () => {
      webSocketService.off(event, callback)
    }
  }, deps)
}

// Hook para funcionalidades de realtime específicas
export function useRealtimeUpdates() {
  const [lastUpdate, setLastUpdate] = useState<RealtimeEvent | null>(null)

  useWebSocketEvent<RealtimeEvent>('realtime_data', (data) => {
    setLastUpdate(data)
  })

  // Eventos específicos de posts
  useWebSocketEvent('post_created', (data) => {
    // Invalidar cache de posts no React Query se necessário
    console.log('Novo post criado:', data)
  })

  useWebSocketEvent('post_updated', (data) => {
    console.log('Post atualizado:', data)
  })

  useWebSocketEvent('post_deleted', (data) => {
    console.log('Post deletado:', data)
  })

  // Eventos específicos de usuários
  useWebSocketEvent('user_update', (data) => {
    console.log('Usuário atualizado:', data)
  })

  return {
    lastUpdate,
  }
}