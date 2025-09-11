<script setup lang="ts">
import WatcherModal from '~/components/modals/WatcherModal.vue';

const toast = useToast();

// SSE Integration for real-time updates
const sse = useSSE();
const recentEvents = ref<Array<{
  id: string;
  type: string;
  timestamp: string;
  data: any;
}>>([]);

const overlay = useOverlay();

const modal = overlay.create(WatcherModal, {
  props: {
    onCancel: () => modal.close(),
    onSuccess: () => {
      modal.close();
    },
  },
});

async function openWatcherModal() {
  await modal.open();
}

// Set up SSE event handlers for watcher updates
onMounted(() => {
  // Listen for new listings found by watchers
  sse.onNewListing((event) => {
    toast.add({
      title: 'New Listing Found!',
      description: `Watcher found a new listing`,
      color: 'success',
    });
    
    addEvent('watcher:new_listing', event.data);
  });

  // Listen for watcher status updates
  sse.onWatcherUpdate((event) => {
    if (event.data.status === 'error') {
      toast.add({
        title: 'Watcher Error',
        description: `Watcher encountered an error`,
        color: 'error',
      });
    }
    
    addEvent('watcher:status_update', event.data);
  });

  // Listen for system notifications
  sse.onNotification((event) => {
    if (event.data.success) {
      toast.add({
        title: 'Notification Sent',
        description: 'New listing notification delivered',
        color: 'success',
      });
    }
    
    addEvent('notification:sent', event.data);
  });

  // Listen for system status updates
  sse.onSystemStatus((event) => {
    if (event.data.status !== 'healthy') {
      toast.add({
        title: 'System Alert',
        description: event.data.message || 'System status changed',
        color: 'warning',
      });
    }
    
    addEvent('system:status', event.data);
  });

  // Listen for heartbeat events (connection verification)
  sse.onHeartbeat((event) => {
    addEvent('heartbeat', event.data);
  });
});

function addEvent(type: string, data: any) {
  const event = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    timestamp: new Date().toLocaleTimeString(),
    data,
  };
  
  recentEvents.value.unshift(event);
  
  // Keep only the last 10 events
  if (recentEvents.value.length > 10) {
    recentEvents.value = recentEvents.value.slice(0, 10);
  }
}

function clearEvents() {
  recentEvents.value = [];
}

// Watch for connection state changes and provide user feedback
watch(() => sse.connected.value, (newValue, oldValue) => {
  if (oldValue !== undefined) { // Avoid initial load notification
    if (newValue) {
      toast.add({
        title: 'Connected',
        description: 'Real-time updates are now active',
        color: 'success',
      });
      
      addEvent('connection:status', { status: 'connected', timestamp: new Date().toISOString() });
    } else {
      toast.add({
        title: 'Disconnected',
        description: 'Real-time updates are paused',
        color: 'neutral',
      });
      
      addEvent('connection:status', { status: 'disconnected', timestamp: new Date().toISOString() });
    }
  }
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header with SSE Status -->
    <div class="flex justify-between items-start lg:items-center">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-bold">Watchers</h1>
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div 
                :class="sse.connected.value ? 'bg-green-500' : 'bg-red-500'"
                class="w-2 h-2 rounded-full"
              />
              <span class="text-sm text-gray-600">
                {{ sse.connected.value ? 'Live' : 'Offline' }}
              </span>
            </div>
            <div class="flex items-center space-x-1">
              <UButton
                v-if="!sse.connected.value"
                @click="sse.connect"
                size="xs"
                color="success"
                variant="soft"
                icon="heroicons:play"
              >
                Connect
              </UButton>
              <UButton
                v-else
                @click="sse.disconnect"
                size="xs"
                color="error"
                variant="soft"
                icon="heroicons:pause"
              >
                Disconnect
              </UButton>
            </div>
          </div>
        </div>
        <p class="text-lg">Manage your watchers and get real-time updates.</p>
      </div>

      <UButton
        class="self-end"
        leading-icon="material-symbols:add-2"
        size="lg"
        @click="openWatcherModal"
      >
        Create New Watcher
      </UButton>
    </div>

    <!-- Recent Events Card -->
    <UCard v-if="recentEvents.length > 0" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <UIcon name="heroicons:bolt" class="text-yellow-500" />
            Recent Activity
          </h2>
          <UButton variant="ghost" size="sm" @click="clearEvents">
            Clear
          </UButton>
        </div>
      </template>
      
      <div class="space-y-2 max-h-48 overflow-y-auto">
        <div 
          v-for="event in recentEvents" 
          :key="event.id"
          class="p-3 rounded-md bg-gray-50 dark:bg-gray-800 border"
        >
          <div class="flex justify-between items-center mb-1">
            <span class="font-medium text-sm">
              {{ event.type.replace('_', ' ').replace(':', ': ') }}
            </span>
            <span class="text-xs text-gray-500">{{ event.timestamp }}</span>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-300">
            {{ JSON.stringify(event.data, null, 0).substring(0, 100) }}...
          </div>
        </div>
      </div>
    </UCard>

    <USeparator />

    <div class="flex flex-col gap-4">
      <WatcherTable />
    </div>
  </div>
</template>
