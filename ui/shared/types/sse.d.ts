// Frontend SSE types matching backend implementation
export type SSEEventType = 
  | 'watcher:status_update'
  | 'watcher:new_listing'
  | 'system:status'
  | 'system:error'
  | 'notification:sent'
  | 'heartbeat';

// Watcher status update event
export interface WatcherStatusUpdateEvent {
  type: 'watcher:status_update';
  data: {
    watcherId: string;
    status: 'active' | 'stopped' | 'running' | 'error' | 'idle';
    message?: string;
    lastRun?: string;
    nextRun?: string;
    newAdsCount?: number;
    error?: string;
  };
}

// New listing event with simplified BlocketAd interface
export interface BlocketAd {
  id: string;
  title: string;
  price: number;
  location: string;
  url: string;
  imageUrl?: string;
  description?: string;
  publishedAt?: string;
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

// System status events
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

// Notification events
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

// Heartbeat event
export interface HeartbeatEvent {
  type: 'heartbeat';
  data: {
    timestamp: string;
    connectionId: string;
    message?: string;
  };
}

// Union type for all possible SSE events
export type SSEEvent = 
  | WatcherStatusUpdateEvent
  | WatcherNewListingEvent
  | SystemStatusEvent
  | SystemErrorEvent
  | NotificationSentEvent
  | HeartbeatEvent;

// Event handler function type
export type SSEEventHandler<T extends SSEEvent = SSEEvent> = (event: T) => void;

// Composable return types
export interface SSEConnection {
  connected: Ref<boolean>;
  lastEventId: Ref<string | null>;
  error: Ref<string | null>;
  connect: () => void;
  disconnect: () => void;
  // Event handler registration
  on: <T extends SSEEvent>(eventType: T['type'], handler: SSEEventHandler<T>) => void;
  off: <T extends SSEEvent>(eventType: T['type'], handler: SSEEventHandler<T>) => void;
  // Convenience methods for specific event types
  onWatcherUpdate: (handler: SSEEventHandler<WatcherStatusUpdateEvent>) => void;
  onNewListing: (handler: SSEEventHandler<WatcherNewListingEvent>) => void;
  onSystemStatus: (handler: SSEEventHandler<SystemStatusEvent>) => void;
  onSystemError: (handler: SSEEventHandler<SystemErrorEvent>) => void;
  onNotification: (handler: SSEEventHandler<NotificationSentEvent>) => void;
  onHeartbeat: (handler: SSEEventHandler<HeartbeatEvent>) => void;
}

// Re-export Ref from Vue for convenience
import type { Ref } from 'vue';