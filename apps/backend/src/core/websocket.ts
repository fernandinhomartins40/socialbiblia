import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger';
import { prisma } from './database';

export interface WebSocketUser {
  id: string;
  email: string;
  role: string;
}

export interface WebSocketConnection {
  socket: Socket;
  user?: WebSocketUser;
  rooms: string[];
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private io: SocketIOServer | null = null;
  private connections: Map<string, WebSocketConnection> = new Map();
  private rooms: Map<string, Set<string>> = new Map();

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  init(server: Server): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    // Middleware de autenticação
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          // Permitir conexões anônimas para alguns eventos
          socket.data.user = null;
          return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Buscar usuário no banco
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true }
        });

        if (!user) {
          return next(new Error('Usuário não encontrado'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        Logger.warn('Erro na autenticação WebSocket:', error);
        // Permitir conexão anônima em caso de erro de token
        socket.data.user = null;
        next();
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    Logger.info('WebSocket Server inicializado');
  }

  private handleConnection(socket: Socket): void {
    const connectionId = socket.id;
    const user = socket.data.user as WebSocketUser | null;

    Logger.info(`Nova conexão WebSocket: ${connectionId}${user ? ` (${user.email})` : ' (anônimo)'}`);

    // Registrar conexão
    this.connections.set(connectionId, {
      socket,
      user: user || undefined,
      rooms: []
    });

    // Event handlers
    socket.on('join_room', (room: string) => {
      this.joinRoom(socket, room);
    });

    socket.on('leave_room', (room: string) => {
      this.leaveRoom(socket, room);
    });

    socket.on('subscribe', (channels: string[]) => {
      this.subscribe(socket, channels);
    });

    socket.on('unsubscribe', (channels: string[]) => {
      this.unsubscribe(socket, channels);
    });

    // Plugin events
    socket.on('plugin_event', (data) => {
      this.handlePluginEvent(socket, data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Enviar evento de conexão bem-sucedida
    socket.emit('connected', {
      connectionId,
      user: user || null,
      timestamp: new Date().toISOString()
    });
  }

  private joinRoom(socket: Socket, room: string): void {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    socket.join(room);
    connection.rooms.push(room);

    // Registrar room
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(socket.id);

    Logger.debug(`Socket ${socket.id} entrou na room: ${room}`);
    
    socket.emit('room_joined', { room, timestamp: new Date().toISOString() });
  }

  private leaveRoom(socket: Socket, room: string): void {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    socket.leave(room);
    connection.rooms = connection.rooms.filter(r => r !== room);

    // Remover da room
    this.rooms.get(room)?.delete(socket.id);
    if (this.rooms.get(room)?.size === 0) {
      this.rooms.delete(room);
    }

    Logger.debug(`Socket ${socket.id} saiu da room: ${room}`);
    
    socket.emit('room_left', { room, timestamp: new Date().toISOString() });
  }

  private subscribe(socket: Socket, channels: string[]): void {
    for (const channel of channels) {
      this.joinRoom(socket, `channel:${channel}`);
    }
    
    socket.emit('subscribed', { 
      channels, 
      timestamp: new Date().toISOString() 
    });
  }

  private unsubscribe(socket: Socket, channels: string[]): void {
    for (const channel of channels) {
      this.leaveRoom(socket, `channel:${channel}`);
    }
    
    socket.emit('unsubscribed', { 
      channels, 
      timestamp: new Date().toISOString() 
    });
  }

  private handlePluginEvent(socket: Socket, data: any): void {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    Logger.debug(`Plugin event de ${socket.id}:`, data);

    // Broadcast para outros sockets na mesma room (se especificada)
    if (data.room) {
      socket.to(data.room).emit('plugin_event', {
        ...data,
        from: connection.user?.id || 'anonymous',
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleDisconnection(socket: Socket): void {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    Logger.info(`Desconexão WebSocket: ${socket.id}`);

    // Remover de todas as rooms
    for (const room of connection.rooms) {
      this.rooms.get(room)?.delete(socket.id);
      if (this.rooms.get(room)?.size === 0) {
        this.rooms.delete(room);
      }
    }

    // Remover conexão
    this.connections.delete(socket.id);
  }

  // Métodos públicos para plugins

  broadcast(event: string, data: any, room?: string): void {
    if (!this.io) return;

    if (room) {
      this.io.to(room).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } else {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastToChannel(channel: string, event: string, data: any): void {
    this.broadcast(event, data, `channel:${channel}`);
  }

  broadcastToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;

    // Encontrar sockets do usuário
    const userSockets = Array.from(this.connections.values())
      .filter(conn => conn.user?.id === userId)
      .map(conn => conn.socket.id);

    for (const socketId of userSockets) {
      this.io.to(socketId).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  getConnectedUsers(): Array<{ id: string; email: string; connectionId: string }> {
    return Array.from(this.connections.values())
      .filter(conn => conn.user)
      .map(conn => ({
        id: conn.user!.id,
        email: conn.user!.email,
        connectionId: conn.socket.id
      }));
  }

  getRoomMembers(room: string): string[] {
    return Array.from(this.rooms.get(room) || []);
  }

  getStats() {
    return {
      totalConnections: this.connections.size,
      authenticatedConnections: Array.from(this.connections.values()).filter(c => c.user).length,
      anonymousConnections: Array.from(this.connections.values()).filter(c => !c.user).length,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([name, members]) => ({
        name,
        memberCount: members.size
      }))
    };
  }
}

// Classe para plugins usarem WebSocket
export class PluginWebSocket {
  protected wsManager: WebSocketManager;

  constructor() {
    this.wsManager = WebSocketManager.getInstance();
  }

  // Broadcast para todos os clientes
  broadcast(event: string, data: any): void {
    this.wsManager.broadcast(event, data);
  }

  // Broadcast para um canal específico
  broadcastToChannel(channel: string, event: string, data: any): void {
    this.wsManager.broadcastToChannel(channel, event, data);
  }

  // Broadcast para um usuário específico
  broadcastToUser(userId: string, event: string, data: any): void {
    this.wsManager.broadcastToUser(userId, event, data);
  }

  // Broadcast para uma room específica
  broadcastToRoom(room: string, event: string, data: any): void {
    this.wsManager.broadcast(event, data, room);
  }
}

// Instância global
export const webSocketManager = WebSocketManager.getInstance();
