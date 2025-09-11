import { Response } from 'express';
import { randomUUID } from 'crypto';
import logger from '@/integrations/logger';
import type { SSEConnection, SSEEvent, SSEManager } from '@/types/sse';

class SSEManagerImpl implements SSEManager {
  public connections = new Map<string, SSEConnection>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
    
    // Cleanup on process termination
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  addConnection(connection: SSEConnection): void {
    this.connections.set(connection.id, connection);
    
    logger.info({
      message: 'SSE connection added',
      connectionId: connection.id,
      userId: connection.userId,
      totalConnections: this.connections.size,
    });

    // Setup connection cleanup on client disconnect
    connection.response.on('close', () => {
      this.removeConnection(connection.id);
    });

    connection.response.on('error', (error: Error) => {
      logger.warn({
        message: 'SSE connection error',
        connectionId: connection.id,
        userId: connection.userId,
        error: error.message,
      });
      this.removeConnection(connection.id);
    });
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      if (!connection.response.writableEnded) {
        connection.response.end();
      }
    } catch (error) {
      logger.debug({
        message: 'Error ending SSE response',
        connectionId,
        error: (error as Error).message,
      });
    }

    this.connections.delete(connectionId);
    
    logger.info({
      message: 'SSE connection removed',
      connectionId,
      userId: connection.userId,
      totalConnections: this.connections.size,
    });
  }

  broadcast(event: SSEEvent): void {
    const message = this.formatSSEMessage(event);
    let successCount = 0;
    let failureCount = 0;

    this.connections.forEach((connection) => {
      try {
        if (!connection.response.writableEnded) {
          connection.response.write(message);
          successCount++;
        } else {
          this.removeConnection(connection.id);
          failureCount++;
        }
      } catch (error) {
        logger.warn({
          message: 'Failed to send SSE message to connection',
          connectionId: connection.id,
          userId: connection.userId,
          eventType: event.type,
          error: (error as Error).message,
        });
        this.removeConnection(connection.id);
        failureCount++;
      }
    });

    if (event.type !== 'heartbeat') {
      logger.debug({
        message: 'SSE event broadcasted',
        eventType: event.type,
        successCount,
        failureCount,
        totalConnections: this.connections.size,
      });
    }
  }

  broadcastToUser(userId: string, event: SSEEvent): void {
    const userConnections = this.getUserConnections(userId);
    const message = this.formatSSEMessage(event);
    let successCount = 0;
    let failureCount = 0;

    userConnections.forEach((connection) => {
      try {
        if (!connection.response.writableEnded) {
          connection.response.write(message);
          successCount++;
        } else {
          this.removeConnection(connection.id);
          failureCount++;
        }
      } catch (error) {
        logger.warn({
          message: 'Failed to send SSE message to user connection',
          connectionId: connection.id,
          userId: connection.userId,
          eventType: event.type,
          error: (error as Error).message,
        });
        this.removeConnection(connection.id);
        failureCount++;
      }
    });

    if (event.type !== 'heartbeat') {
      logger.debug({
        message: 'SSE event sent to user',
        userId,
        eventType: event.type,
        successCount,
        failureCount,
        userConnections: userConnections.length,
      });
    }
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getUserConnections(userId: string): SSEConnection[] {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.userId === userId,
    );
  }

  cleanup(): void {
    logger.info({
      message: 'SSE manager cleanup initiated',
      totalConnections: this.connections.size,
    });

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    this.connections.forEach((connection) => {
      try {
        if (!connection.response.writableEnded) {
          connection.response.write(':shutdown\n\n');
          connection.response.end();
        }
      } catch (error) {
        logger.debug({
          message: 'Error during connection cleanup',
          connectionId: connection.id,
          error: (error as Error).message,
        });
      }
    });

    this.connections.clear();
    
    logger.info({
      message: 'SSE manager cleanup completed',
    });
  }

  private formatSSEMessage(event: SSEEvent): string {
    const id = Date.now();
    const eventType = event.type;
    const data = JSON.stringify(event.data);

    return `id: ${id}\nevent: ${eventType}\ndata: ${data}\n\n`;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      
      // Send heartbeat to all connections
      this.connections.forEach((connection) => {
        connection.lastHeartbeat = now;
      });

      // Send heartbeat event (this will also clean up stale connections)
      this.broadcast({
        type: 'heartbeat',
        data: {
          timestamp: now.toISOString(),
          connectionId: 'server',
        },
      });

      // Remove stale connections (older than 30 seconds without heartbeat)
      const staleThreshold = new Date(now.getTime() - 30000);
      this.connections.forEach((connection) => {
        if (connection.lastHeartbeat < staleThreshold) {
          logger.warn({
            message: 'Removing stale SSE connection',
            connectionId: connection.id,
            userId: connection.userId,
            lastHeartbeat: connection.lastHeartbeat.toISOString(),
          });
          this.removeConnection(connection.id);
        }
      });
    }, 15000); // Heartbeat every 15 seconds
  }

  // Helper method to create a new connection
  createConnection(userId: string, response: Response): SSEConnection {
    const connection: SSEConnection = {
      id: randomUUID(),
      userId,
      response,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    };

    return connection;
  }
}

// Singleton instance
export const sseManager = new SSEManagerImpl();

// Helper function to send events from other parts of the application
export function sendSSEEvent(event: SSEEvent): void {
  sseManager.broadcast(event);
}

export function sendSSEEventToUser(userId: string, event: SSEEvent): void {
  sseManager.broadcastToUser(userId, event);
}