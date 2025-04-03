<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';

const watcherStore = useWatcherStore();

const { activeWatchers } = storeToRefs(watcherStore);

const items = ref<NavigationMenuItem[][]>([
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

const isCollapsed = ref(false);

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<template>
  <UContainer
    class="flex flex-col h-dvh py-5 gap-5 bg-neutral-900 border-r-[1px] border-r-neutral-800 dark:border-r-neutral-700"
    :class="{ 'w-16': isCollapsed }"
  >
    <header
      class="flex items-center justify-between"
      :class="{ 'justify-center': isCollapsed }"
    >
      <h1 v-if="!isCollapsed" class="font-bold text-xl">Blocket Bot</h1>
      <UTooltip
        v-if="isCollapsed"
        text="Expand sidebar"
        :delay-duration="250"
        :content="{
          side: 'right',
        }"
      >
        <UButton
          :ui="{
            leadingIcon: 'scale-125',
          }"
          size="xl"
          variant="ghost"
          icon="tabler:layout-sidebar-left-expand"
          @click="toggleSidebar"
        />
      </UTooltip>
      <UTooltip
        v-else
        text="Collapse sidebar"
        :delay-duration="250"
        :content="{
          side: 'bottom',
        }"
      >
        <UButton
          :ui="{
            leadingIcon: 'scale-125',
          }"
          size="xl"
          variant="ghost"
          icon="tabler:layout-sidebar-left-collapse"
          @click="toggleSidebar"
        />
      </UTooltip>
    </header>

    <UNavigationMenu
      orientation="vertical"
      :items="items"
      :collapsed="isCollapsed"
      :class="[
        'data-[orientation=vertical]:w-48 max-w-full',
        isCollapsed ? 'items-center' : 'items-start',
      ]"
      :ui="{
        list: isCollapsed ? 'flex flex-col gap-2 w-fit' : 'w-48',
        item: isCollapsed ? 'scale-120' : '',
      }"
    />

    <footer v-if="!isCollapsed" class="mt-auto">
      <p>Signed in</p>
    </footer>
  </UContainer>
</template>
