import { ref, onBeforeUnmount, onMounted } from 'vue';
import type {
  SSEEvent,
  SSEEventHandler,
  SSEConnection,
  WatcherStatusUpdateEvent,
  WatcherNewListingEvent,
  SystemStatusEvent,
  SystemErrorEvent,
  NotificationSentEvent,
  HeartbeatEvent,
} from '../../shared/types/sse';

export function useSSE(path = '/api/sse'): SSEConnection {
  const connected = ref(false);
  const lastEventId = ref<string | null>(null);
  const error = ref<string | null>(null);

  let es: EventSource | null = null;
  const eventHandlers = new Map<string, Set<SSEEventHandler>>();

  const connect = () => {
    console.log('[SSE Frontend] Connect called');
    console.log('[SSE Frontend] Server-side rendering:', import.meta.server);
    console.log('[SSE Frontend] Existing EventSource:', es);
    console.log('[SSE Frontend] Path:', path);
    
    if (import.meta.server) {
      console.log('[SSE Frontend] Skipping connection (SSR)');
      return;
    }
    
    if (es) {
      console.log('[SSE Frontend] Skipping connection (already exists)');
      return;
    }

    // Clear previous error
    error.value = null;
    console.log('[SSE Frontend] Creating EventSource...');

    try {
      es = new EventSource(path, {
        withCredentials: true
      });
      console.log('[SSE Frontend] EventSource created:', es);
      console.log('[SSE Frontend] Initial state:', es.readyState);
    } catch (createError) {
      console.error('[SSE Frontend] Error creating EventSource:', createError);
      error.value = 'Failed to create connection';
      return;
    }

    es.addEventListener('open', () => {
      connected.value = true;
      error.value = null;
      console.log('[SSE Frontend] Connection established!');
      console.log('[SSE Frontend] EventSource state:', es?.readyState);
      console.log('[SSE Frontend] URL:', es?.url);
    });

    es.addEventListener('error', (event) => {
      connected.value = false;
      error.value = 'Connection lost';
      console.error('[SSE Frontend] Connection error:', event);
      console.error('[SSE Frontend] EventSource state:', es?.readyState);
      console.error('[SSE Frontend] EventSource URL:', es?.url);
      console.error('[SSE Frontend] Event details:', {
        type: event.type,
        eventPhase: event.eventPhase
      });
      // Browser auto-retries; nothing else needed
    });

    // Handle all SSE events generically
    es.addEventListener('message', (event: MessageEvent) => {
      try {
        lastEventId.value = event.lastEventId ?? null;
        const data = JSON.parse(event.data) as SSEEvent;

        console.log('[SSE Frontend] 📨 Received SSE event:', {
          type: data.type,
          data: data.data,
          lastEventId: event.lastEventId
        });

        // Call registered handlers for this event type
        const handlers = eventHandlers.get(data.type);
        if (handlers && handlers.size > 0) {
          console.log(`[SSE Frontend] 🔔 Found ${handlers.size} handlers for event type: ${data.type}`);
          handlers.forEach((handler) => {
            try {
              handler(data);
            } catch (handlerError) {
              console.error(
                `[SSE Frontend] ❌ Error in SSE event handler for ${data.type}:`,
                handlerError
              );
            }
          });
        } else {
          console.log(`[SSE Frontend] ⚠️ No handlers registered for event type: ${data.type}`);
        }
      } catch (parseError) {
        console.error('[SSE Frontend] ❌ Error parsing SSE event data:', parseError);
        console.error('[SSE Frontend] Raw event data:', event.data);
        error.value = 'Invalid event data received';
      }
    });

    // Handle specific named events that might come through
    const eventTypes = [
      'watcher:status_update',
      'watcher:new_listing',
      'system:status',
      'system:error',
      'notification:sent',
      'heartbeat',
    ] as const;

    eventTypes.forEach((eventType) => {
      es?.addEventListener(eventType, (event: MessageEvent) => {
        try {
          lastEventId.value = event.lastEventId ?? null;
          const data = JSON.parse(event.data);
          const sseEvent: SSEEvent = { type: eventType, data };

          console.log(`[SSE Frontend] 🎯 Received specific event '${eventType}':`, {
            data: sseEvent.data,
            lastEventId: event.lastEventId
          });

          // Call registered handlers for this event type
          const handlers = eventHandlers.get(eventType);
          if (handlers && handlers.size > 0) {
            console.log(`[SSE Frontend] 🔔 Found ${handlers.size} specific handlers for: ${eventType}`);
            handlers.forEach((handler) => {
              try {
                handler(sseEvent);
              } catch (handlerError) {
                console.error(
                  `[SSE Frontend] ❌ Error in specific SSE event handler for ${eventType}:`,
                  handlerError
                );
              }
            });
          } else {
            console.log(`[SSE Frontend] ⚠️ No specific handlers registered for: ${eventType}`);
          }
        } catch (parseError) {
          console.error(`[SSE Frontend] ❌ Error parsing specific SSE ${eventType} event:`, parseError);
          console.error('[SSE Frontend] Raw specific event data:', event.data);
        }
      });
    });
  };

  const disconnect = () => {
    if (es) {
      es.close();
      es = null;
      connected.value = false;
      error.value = null;
    }
  };

  // Generic event handler registration
  const on = <T extends SSEEvent>(
    eventType: T['type'],
    handler: SSEEventHandler<T>
  ) => {
    if (!eventHandlers.has(eventType)) {
      eventHandlers.set(eventType, new Set());
    }
    eventHandlers.get(eventType)!.add(handler as SSEEventHandler);
  };

  const off = <T extends SSEEvent>(
    eventType: T['type'],
    handler: SSEEventHandler<T>
  ) => {
    const handlers = eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as SSEEventHandler);
      if (handlers.size === 0) {
        eventHandlers.delete(eventType);
      }
    }
  };

  // Convenience methods for specific event types
  const onWatcherUpdate = (
    handler: SSEEventHandler<WatcherStatusUpdateEvent>
  ) => {
    on('watcher:status_update', handler);
  };

  const onNewListing = (handler: SSEEventHandler<WatcherNewListingEvent>) => {
    on('watcher:new_listing', handler);
  };

  const onSystemStatus = (handler: SSEEventHandler<SystemStatusEvent>) => {
    on('system:status', handler);
  };

  const onSystemError = (handler: SSEEventHandler<SystemErrorEvent>) => {
    on('system:error', handler);
  };

  const onNotification = (handler: SSEEventHandler<NotificationSentEvent>) => {
    on('notification:sent', handler);
  };

  const onHeartbeat = (handler: SSEEventHandler<HeartbeatEvent>) => {
    on('heartbeat', handler);
  };


  onMounted(connect);
  onBeforeUnmount(() => {
    disconnect();
    eventHandlers.clear();
  });

  return {
    connected,
    lastEventId,
    error,
    connect,
    disconnect,
    on,
    off,
    onWatcherUpdate,
    onNewListing,
    onSystemStatus,
    onSystemError,
    onNotification,
    onHeartbeat,
  };
}
