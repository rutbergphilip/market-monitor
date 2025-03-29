<script setup lang="ts">
import CreateWatcherModal from '~/components/modals/CreateWatcherModal.vue';

const overlay = useOverlay();

const modal = overlay.create(CreateWatcherModal, {
  props: {
    onCancel: () => modal.close(),
    onSuccess: () => {
      modal.close();
    },
  },
});

async function openCreateWatcherModal() {
  await modal.open();
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold">Watchers</h1>
        <p class="text-lg">Manage your watchers.</p>
      </div>

      <UButton
        class="self-end"
        leading-icon="material-symbols:add-2"
        size="lg"
        @click="openCreateWatcherModal"
      >
        Create New Watcher
      </UButton>
    </div>

    <USeparator />

    <div class="flex flex-col gap-4">
      <WatcherTable />
    </div>
  </div>
</template>
