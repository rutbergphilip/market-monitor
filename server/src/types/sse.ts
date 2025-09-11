import type { Watcher } from './watchers';
import type { BlocketAd } from 'blocket.js';

export type SSEEventType = 
  | 'watcher:status_update'
  | 'watcher:new_listing'
  | 'system:status'
  | 'system:error'
  | 'notification:sent'
  | 'heartbeat';

export interface WatcherStatusUpdateEvent {
  type: 'watcher:status_update';
  data: {
    watcherId: string;
    status: 'active' | 'stopped' | 'running' | 'error';
    message?: string;
    lastRun?: string;
    nextRun?: string;
  };
}

export interface WatcherNewListingEvent {
  type: 'watcher:new_listing';
  data: {
    watcherId: string;
    watcherQuery: string;
    listing: BlocketAd;
    matchedFilters: string[];
  };
}

export interface SystemStatusEvent {
  type: 'system:status';
  data: {
    status: 'healthy' | 'degraded' | 'down';
    message: string;
    timestamp: string;
    metrics?: {
      activeWatchers: number;
      connectedClients: number;
      uptime: number;
    };
  };
}

export interface SystemErrorEvent {
  type: 'system:error';
  data: {
    error: string;
    code?: string;
    timestamp: string;
    context?: Record<string, any>;
  };
}

export interface NotificationSentEvent {
  type: 'notification:sent';
  data: {
    watcherId: string;
    notificationType: 'DISCORD' | 'EMAIL';
    success: boolean;
    message?: string;
    timestamp: string;
  };
}

export interface HeartbeatEvent {
  type: 'heartbeat';
  data: {
    timestamp: string;
    connectionId: string;
    message?: string;
  };
}

export type SSEEvent = 
  | WatcherStatusUpdateEvent
  | WatcherNewListingEvent
  | SystemStatusEvent
  | SystemErrorEvent
  | NotificationSentEvent
  | HeartbeatEvent;

export interface SSEConnection {
  id: string;
  userId: string;
  response: import('express').Response;
  connectedAt: Date;
  lastHeartbeat: Date;
}

export interface SSEManager {
  connections: Map<string, SSEConnection>;
  addConnection(connection: SSEConnection): void;
  removeConnection(connectionId: string): void;
  broadcast(event: SSEEvent): void;
  broadcastToUser(userId: string, event: SSEEvent): void;
  getConnectionCount(): number;
  getUserConnections(userId: string): SSEConnection[];
  cleanup(): void;
}