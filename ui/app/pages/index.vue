<script setup lang="ts">
import WatcherModal from '~/components/modals/WatcherModal.vue';

const toast = useToast();
const watcherStore = useWatcherStore();

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

onMounted(() => {
  sse.onNewListing((event) => {
    toast.add({
      title: 'New Listing Found!',
      description: `Watcher found a new listing`,
      color: 'success',
    });
  });

  sse.onWatcherUpdate(async (event) => {
    watcherStore.updateWatcherFromSSE({
      watcherId: event.data.watcherId,
      status: event.data.status,
      message: event.data.message,
      lastRun: event.data.lastRun,
      nextRun: event.data.nextRun,
      newAdsCount: event.data.newAdsCount,
      error: event.data.error,
    });

    await nextTick();
  });
  sse.onNotification((event) => {
    if (event.data.success) {
      toast.add({
        title: 'Notification Sent',
        description: 'New listing notification delivered',
        color: 'success',
      });
    }
  });

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
