<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const statesStore = useStatesStore();
const watcherStore = useWatcherStore();

const { sidebarOpen } = storeToRefs(statesStore);
const { activeWatchers } = storeToRefs(watcherStore);

const items = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Watchers',
      icon: 'i-lucide-house',
      to: '/',
      badge: activeWatchers.value.length,
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      defaultOpen: true,
      disabled: true,
      children: [
        {
          label: 'General',
          icon: 'i-lucide-settings',
          to: '/settings/general',
        },
        {
          label: 'Notifications',
          icon: 'i-lucide-bell',
          to: '/settings/notifications',
        },
        {
          label: 'Account',
          icon: 'i-lucide-user',
          to: '/settings/account',
        },
      ],
    },
  ],
]);
</script>

<template>
  <USlideover
    side="left"
    :open="sidebarOpen"
    :close="{ onClick: statesStore.closeSidebar }"
    :dismissible="true"
  >
    <template #content>
      <div class="h-full flex flex-col w-full bg-white dark:bg-gray-900">
        <div class="p-4 flex justify-end">
          <UButton
            class="w-min"
            icon="i-heroicons-x-mark"
            variant="ghost"
            color="neutral"
            aria-label="Close navigation menu"
            @click="statesStore.closeSidebar"
          />
        </div>

        <div class="flex-1 overflow-y-auto p-2 w-full">
          <UNavigationMenu
            orientation="vertical"
            :items="items"
            variant="pill"
          />
        </div>
      </div>
    </template>
  </USlideover>
</template>
