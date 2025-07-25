import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export interface PluginWebSocket {
    io: SocketIOServer;
    emit(event: string, data: any): void;
    broadcast(event: string, data: any): void;
}

class WebSocketManager {
    private io: SocketIOServer | null = null;

    initialize(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log('WebSocket client connected:', socket.id);
            
            socket.on('disconnect', () => {
                console.log('WebSocket client disconnected:', socket.id);
            });
        });

        return this.io;
    }

    getIO(): SocketIOServer | null {
        return this.io;
    }

    emit(event: string, data: any) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    broadcast(event: string, data: any) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    getStats() {
        return {
            connectedClients: this.io ? this.io.engine.clientsCount : 0,
            rooms: this.io ? Object.keys(this.io.sockets.adapter.rooms) : [],
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }
}

export const webSocketManager = new WebSocketManager();
export default webSocketManager; 