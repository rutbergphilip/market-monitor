<script setup lang="ts">
const statesStore = useStatesStore();
</script>

<template>
  <div class="bg-white dark:bg-gray-900 shadow h-16 flex items-center px-4">
    <UButton
      icon="i-heroicons-bars-3"
      variant="ghost"
      color="neutral"
      aria-label="Open navigation menu"
      @click="statesStore.openSidebar"
    />
    <div class="ml-4 text-lg font-semibold">Blocket Bot</div>
    <div class="ml-auto flex items-center space-x-2">
      <UserDropdown />
    </div>
  </div>
</template>
