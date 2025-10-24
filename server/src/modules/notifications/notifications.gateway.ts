import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('🔌 NotificationsGateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub;
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);

      (client as any).userId = userId;
      
      this.logger.log(`✅ Client ${client.id} connected (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(client.id);
      
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
    
    this.logger.log(`❌ Client ${client.id} disconnected (User: ${userId})`);
  }

  sendNotificationToUser(userId: string, notification: any) {
    const socketIds = this.userSockets.get(userId);
    
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('notification', notification);
      });
      
      this.logger.log(`📬 Sent notification to user ${userId} (${socketIds.size} connections)`);
      return true;
    }
    
    this.logger.debug(`No active connections for user ${userId}`);
    return false;
  }

  sendNotificationToUsers(userIds: string[], notification: any) {
    let sentCount = 0;
    
    userIds.forEach((userId) => {
      if (this.sendNotificationToUser(userId, notification)) {
        sentCount++;
      }
    });
    
    this.logger.log(`📬 Sent notification to ${sentCount}/${userIds.length} users`);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}
