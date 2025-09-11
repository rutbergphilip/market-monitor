import type { Request, Response } from 'express';
import logger from '@/integrations/logger';
import { sseManager } from '@/services/sse-manager';
import type { SSEEvent, SystemStatusEvent } from '@/types/sse';

// Extend Express Request type to include userId from JWT middleware
interface AuthenticatedRequest extends Request {
  userId: string;
}

export function sseHandler(req: Request, res: Response): void {
  logger.info({
    message: '[SSE Backend] Incoming SSE request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    authorization: req.headers.authorization ? 'present' : 'missing'
  });

  const authenticatedReq = req as AuthenticatedRequest;
  const userId = authenticatedReq.userId;

  logger.info({ message: '[SSE Backend] User ID from auth middleware', userId });

  if (!userId) {
    logger.warn({
      message: 'SSE connection attempted without user ID',
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(401).json({ 
      error: 'Authentication required',
      code: 'NO_USER_ID' 
    });
    return;
  }

  // Set up SSE headers
  logger.info({ message: '[SSE Backend] Setting SSE headers for user', userId });
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Immediately flush a comment to establish connection
  logger.info({ message: '[SSE Backend] Sending initial connection ping' });
  res.write(':connected\n\n');

  // Create and register the connection
  logger.info({ message: '[SSE Backend] Creating SSE connection object' });
  const connection = sseManager.createConnection(userId, res);
  logger.info({ message: '[SSE Backend] Connection created', connectionId: connection.id });
  
  sseManager.addConnection(connection);
  logger.info({ message: '[SSE Backend] Connection registered with manager' });

  logger.info({
    message: 'SSE connection established',
    userId,
    connectionId: connection.id,
    clientIp: req.ip,
    userAgent: req.headers['user-agent'],
    totalConnections: sseManager.getConnectionCount(),
  });

  // Send initial system status to the new connection
  logger.info({ message: '[SSE Backend] Preparing initial status event' });
  const initialStatusEvent: SystemStatusEvent = {
    type: 'system:status',
    data: {
      status: 'healthy',
      message: 'Connected to real-time updates',
      timestamp: new Date().toISOString(),
      metrics: {
        activeWatchers: 0, // This would come from your watcher service
        connectedClients: sseManager.getConnectionCount(),
        uptime: process.uptime(),
      },
    },
  };

  // Send the initial event directly to this connection
  logger.info({ message: '[SSE Backend] Sending initial event to client' });
  try {
    const message = formatSSEMessage(initialStatusEvent);
    logger.info({ message: '[SSE Backend] Formatted message', messagePreview: message.substring(0, 100) + '...' });
    res.write(message);
    logger.info({ message: '[SSE Backend] Initial event sent successfully' });
  } catch (error) {
    logger.warn({
      message: 'Failed to send initial SSE event',
      userId,
      connectionId: connection.id,
      error: (error as Error).message,
    });
  }

  // Set up basic keepalive heartbeat (no events sent to client)
  const heartbeatInterval = setInterval(() => {
    if (res.destroyed || res.writableEnded) {
      clearInterval(heartbeatInterval);
      return;
    }

    try {
      // Send a simple comment to keep connection alive
      res.write(': keepalive\n\n');
    } catch (error) {
      clearInterval(heartbeatInterval);
    }
  }, 30000); // Send keepalive every 30 seconds

  // Handle client disconnect
  req.on('close', () => {
    logger.info({
      message: 'SSE client disconnected',
      userId,
      connectionId: connection.id,
      connectedDuration: Date.now() - connection.connectedAt.getTime(),
    });
    clearInterval(heartbeatInterval);
    sseManager.removeConnection(connection.id);
  });

  // Handle connection errors
  req.on('error', (error: Error) => {
    logger.warn({
      message: 'SSE connection error',
      userId,
      connectionId: connection.id,
      error: error.message,
    });
    clearInterval(heartbeatInterval);
    sseManager.removeConnection(connection.id);
  });
}

// Helper function to format SSE messages (used for initial message)
function formatSSEMessage(event: SSEEvent): string {
  const id = Date.now();
  const eventType = event.type;
  const data = JSON.stringify(event.data);

  return `id: ${id}\nevent: ${eventType}\ndata: ${data}\n\n`;
}

// Export helper functions for other parts of the application to use
export { sseManager } from '@/services/sse-manager';
export { sendSSEEvent, sendSSEEventToUser } from '@/services/sse-manager';
