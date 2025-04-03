<script setup lang="ts">
const sidebarCollapsed = inject('sidebarCollapsed', ref(false));
</script>

<template>
  <div class="flex">
    <Sidebar class="flex-shrink-0" />
    <div
      class="flex-1 transition-all duration-200"
      :class="{ 'ml-16': sidebarCollapsed, 'ml-60': !sidebarCollapsed }"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <slot />
      </div>
    </div>
  </div>
</template>
