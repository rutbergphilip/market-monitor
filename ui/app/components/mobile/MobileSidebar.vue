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
    title="Blocket Bot"
    :open="sidebarOpen"
    :close="{ onClick: statesStore.closeSidebar }"
    :dismissible="true"
  >
    <template #body>
      <UNavigationMenu orientation="vertical" :items="items" variant="pill" />
    </template>
  </USlideover>
</template>
