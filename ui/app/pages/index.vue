<script setup lang="ts">
import WatcherModal from '~/components/modals/WatcherModal.vue';

const toast = useToast();
const watcherStore = useWatcherStore();

// SSE Integration for real-time updates
const sse = useSSE();

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
  });

  // Listen for watcher status updates
  sse.onWatcherUpdate(async (event) => {
    console.log('[SSE Handler] 📡 Received watcher update event:', event);
    
    // Update the watcher store with the new data
    watcherStore.updateWatcherFromSSE({
      watcherId: event.data.watcherId,
      status: event.data.status,
      message: event.data.message,
      lastRun: event.data.lastRun,
      nextRun: event.data.nextRun,
      newAdsCount: event.data.newAdsCount,
      error: event.data.error,
    });

    // Wait for next tick to ensure store update completes
    await nextTick();
    console.log('[SSE Handler] ✅ Store update completed for watcher:', event.data.watcherId);
    
    // Show appropriate toast notifications
    if (event.data.status === 'error') {
      toast.add({
        title: 'Watcher Error',
        description: `Watcher ${event.data.watcherId} encountered an error`,
        color: 'error',
      });
    } else if (event.data.status === 'running') {
      toast.add({
        title: 'Watcher Started',
        description: `Watcher ${event.data.watcherId} is now running`,
        color: 'info',
      });
    } else if (event.data.status === 'idle' && event.data.newAdsCount && event.data.newAdsCount > 0) {
      toast.add({
        title: 'New Listings Found',
        description: `Watcher ${event.data.watcherId} found ${event.data.newAdsCount} new listings`,
        color: 'success',
      });
    } else if (event.data.status === 'idle' && (!event.data.newAdsCount || event.data.newAdsCount === 0)) {
      // Optionally show a subtle notification for completed jobs with no new ads
      toast.add({
        title: 'Watcher Completed',
        description: `Watcher ${event.data.watcherId} completed successfully`,
        color: 'info',
      });
    }
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
  });
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex justify-between items-start lg:items-center">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold">Watchers</h1>
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

    <div class="flex flex-col gap-4">
      <WatcherTable />
    </div>
  </div>
</template>
