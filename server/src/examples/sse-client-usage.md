# SSE Client Usage Examples

This document provides examples of how to connect to and use the SSE (Server-Sent Events) endpoint from the Nuxt frontend application.

## Frontend Integration (Nuxt/Vue)

### Basic Connection Setup

```typescript
// composables/useSSE.ts
import { ref, onMounted, onUnmounted } from 'vue'

export interface SSEEvent {
  type: string
  data: any
  id?: string
}

export function useSSE() {
  const isConnected = ref(false)
  const connectionStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const lastError = ref<string | null>(null)
  
  let eventSource: EventSource | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  const connect = async () => {
    try {
      connectionStatus.value = 'connecting'
      
      // Get auth token (from cookie, localStorage, or store)
      const { $fetch } = useNuxtApp()
      const token = useCookie('auth_token').value
      
      if (!token) {
        throw new Error('No authentication token available')
      }

      // Create EventSource connection
      eventSource = new EventSource('/api/sse', {
        withCredentials: true // Include cookies for authentication
      })

      // Connection opened
      eventSource.onopen = () => {
        console.log('SSE connection established')
        isConnected.value = true
        connectionStatus.value = 'connected'
        reconnectAttempts = 0
        lastError.value = null
      }

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        isConnected.value = false
        connectionStatus.value = 'error'
        lastError.value = 'Connection error'
        
        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts++
            connect()
          }, reconnectDelay)
        }
      }

      // Handle close
      eventSource.addEventListener('close', () => {
        isConnected.value = false
        connectionStatus.value = 'disconnected'
      })

    } catch (error) {
      console.error('Failed to establish SSE connection:', error)
      connectionStatus.value = 'error'
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
    }
  }

  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    isConnected.value = false
    connectionStatus.value = 'disconnected'
  }

  const addEventListener = (eventType: string, handler: (event: MessageEvent) => void) => {
    if (eventSource) {
      eventSource.addEventListener(eventType, handler)
    }
  }

  const removeEventListener = (eventType: string, handler: (event: MessageEvent) => void) => {
    if (eventSource) {
      eventSource.removeEventListener(eventType, handler)
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected: readonly(isConnected),
    connectionStatus: readonly(connectionStatus),
    lastError: readonly(lastError),
    connect,
    disconnect,
    addEventListener,
    removeEventListener
  }
}
```

### Watcher Updates Component

```vue
<template>
  <div class="watcher-updates">
    <div class="connection-status" :class="connectionStatus">
      <span class="status-indicator"></span>
      {{ connectionStatus === 'connected' ? 'Live' : connectionStatus }}
    </div>

    <div v-if="watcherUpdates.length > 0" class="updates-list">
      <div 
        v-for="update in watcherUpdates" 
        :key="update.id"
        class="update-item"
        :class="update.status"
      >
        <div class="update-header">
          <span class="watcher-id">{{ update.watcherId }}</span>
          <span class="timestamp">{{ formatTime(update.timestamp) }}</span>
        </div>
        <div class="update-message">{{ update.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface WatcherUpdate {
  id: string
  watcherId: string
  status: 'active' | 'stopped' | 'running' | 'error'
  message?: string
  timestamp: string
}

const { addEventListener, connectionStatus, isConnected } = useSSE()
const watcherUpdates = ref<WatcherUpdate[]>([])

// Handle watcher status updates
const handleWatcherStatusUpdate = (event: MessageEvent) => {
  const data = JSON.parse(event.data)
  
  const update: WatcherUpdate = {
    id: event.lastEventId || Date.now().toString(),
    watcherId: data.watcherId,
    status: data.status,
    message: data.message,
    timestamp: data.lastRun || new Date().toISOString()
  }
  
  // Add to beginning of list and limit to 50 items
  watcherUpdates.value = [update, ...watcherUpdates.value.slice(0, 49)]
}

// Handle new listing notifications
const handleNewListing = (event: MessageEvent) => {
  const data = JSON.parse(event.data)
  
  // Show notification or update UI
  console.log('New listing found:', data)
  
  // You could emit a notification here
  // $toast.success(`New listing found for watcher ${data.watcherId}`)
}

// Handle system status
const handleSystemStatus = (event: MessageEvent) => {
  const data = JSON.parse(event.data)
  console.log('System status:', data)
}

// Handle errors
const handleSystemError = (event: MessageEvent) => {
  const data = JSON.parse(event.data)
  console.error('System error:', data)
  // You could show an error notification here
}

// Setup event listeners
onMounted(() => {
  addEventListener('watcher:status_update', handleWatcherStatusUpdate)
  addEventListener('watcher:new_listing', handleNewListing)
  addEventListener('system:status', handleSystemStatus)
  addEventListener('system:error', handleSystemError)
})

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}
</script>

<style scoped>
.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.connection-status.connected {
  background-color: #dcfce7;
  color: #16a34a;
}

.connection-status.connecting {
  background-color: #fef3c7;
  color: #d97706;
}

.connection-status.disconnected,
.connection-status.error {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: currentColor;
}

.updates-list {
  margin-top: 1rem;
}

.update-item {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.update-item.running {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.update-item.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.update-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.watcher-id {
  font-weight: 600;
  color: #374151;
}

.timestamp {
  color: #6b7280;
}

.update-message {
  color: #4b5563;
  font-size: 0.875rem;
}
</style>
```

### Notification Toast Integration

```typescript
// composables/useSSENotifications.ts
export function useSSENotifications() {
  const { addEventListener } = useSSE()
  const { $toast } = useNuxtApp() // or your toast library

  const setupNotificationHandlers = () => {
    // Handle new listings
    addEventListener('watcher:new_listing', (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      $toast.success(`New listing found: ${data.listing.subject}`, {
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to listing or open modal
            navigateTo(`/listings/${data.listing.id}`)
          }
        }
      })
    })

    // Handle notification status
    addEventListener('notification:sent', (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      if (data.success) {
        $toast.success(`${data.notificationType} notification sent`)
      } else {
        $toast.error(`Failed to send ${data.notificationType} notification: ${data.message}`)
      }
    })

    // Handle system errors
    addEventListener('system:error', (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      $toast.error(`System error: ${data.error}`)
    })
  }

  return {
    setupNotificationHandlers
  }
}
```

### Usage in Layout or App

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <HeaderComponent />
    <main>
      <slot />
    </main>
    <SSEConnectionIndicator />
  </div>
</template>

<script setup>
const { setupNotificationHandlers } = useSSENotifications()

onMounted(() => {
  setupNotificationHandlers()
})
</script>
```

## Authentication

The SSE endpoint uses the same JWT authentication as the rest of the API. The connection will automatically include cookies, so if the user is logged in via cookie-based auth, the SSE connection will work automatically.

For bearer token authentication, you would need to pass the token in the URL or use a library that supports custom headers for EventSource connections.

## Error Handling and Reconnection

The SSE composable includes automatic reconnection logic with exponential backoff. If the connection is lost, it will automatically attempt to reconnect up to 5 times with a 3-second delay between attempts.

## Events Reference

| Event Type | Description | Data Structure |
|------------|-------------|----------------|
| `watcher:status_update` | Watcher status changes | `{ watcherId, status, message, lastRun, nextRun }` |
| `watcher:new_listing` | New listing found | `{ watcherId, watcherQuery, listing, matchedFilters }` |
| `system:status` | System health updates | `{ status, message, timestamp, metrics }` |
| `system:error` | System errors | `{ error, code, timestamp, context }` |
| `notification:sent` | Notification delivery status | `{ watcherId, notificationType, success, message, timestamp }` |
| `heartbeat` | Connection keepalive | `{ timestamp, connectionId }` |