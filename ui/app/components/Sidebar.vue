<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';

const watcherStore = useWatcherStore();
const authStore = useAuthStore();
const statesStore = useStatesStore();

const { activeWatchers } = storeToRefs(watcherStore);
const { isAuthenticated } = storeToRefs(authStore);
const { sidebarCollapsed } = storeToRefs(statesStore);

const items = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Watchers',
      icon: 'i-lucide-house',
      to: '/',
      badge: activeWatchers.value.length,
    },
    ...(isCollapsed.value
      ? [
          // When collapsed, settings becomes a direct link
          {
            label: 'Settings',
            icon: 'i-lucide-settings',
            to: '/settings',
          },
        ]
      : [
          // When expanded, settings has children
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
        ]),
  ],
]);

// Use the store state directly for reactivity
const isCollapsed = computed(() => sidebarCollapsed.value);

function toggleSidebar() {
  statesStore.toggleSidebarCollapsed();
}
</script>

<template>
  <ClientOnly>
    <UContainer
      class="flex flex-col h-dvh py-5 gap-5 bg-white dark:bg-neutral-900 border-r-[1px] border-r-neutral-200 dark:border-r-neutral-800 fixed left-0 top-0 z-10"
      :class="{ 'w-16': isCollapsed, 'w-60': !isCollapsed }"
    >
      <header
        class="flex items-center justify-between"
        :class="{ 'justify-center': isCollapsed }"
      >
        <h1
          v-if="!isCollapsed"
          class="font-bold text-xl text-neutral-900 dark:text-white"
        >
          Market Monitor
        </h1>
        <div v-if="!isCollapsed" class="flex items-center space-x-2">
          <UTooltip
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
        </div>
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
      </header>

      <div class="flex flex-col h-full">
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

        <div
          v-if="isAuthenticated"
          :class="{ hidden: isCollapsed }"
          class="mt-auto"
        >
          <User />
        </div>
        <div v-if="isAuthenticated && isCollapsed" class="self-center mt-auto">
          <UserDropdown variant="compact" size="sm" />
        </div>
      </div>
    </UContainer>
    <template #fallback>
      <UContainer
        class="flex flex-col h-dvh py-5 gap-5 bg-white dark:bg-neutral-900 border-r-[1px] border-r-neutral-200 dark:border-r-neutral-800 fixed left-0 top-0 z-10 w-60"
      >
        <header class="flex items-center justify-between">
          <h1 class="font-bold text-xl text-neutral-900 dark:text-white">
            Market Monitor
          </h1>
          <div class="flex items-center space-x-2">
            <UButton
              :ui="{
                leadingIcon: 'scale-125',
              }"
              size="xl"
              variant="ghost"
              icon="tabler:layout-sidebar-left-collapse"
            />
          </div>
        </header>

        <div class="flex flex-col h-full">
          <UNavigationMenu
            orientation="vertical"
            :items="items"
            class="data-[orientation=vertical]:w-48 max-w-full items-start"
            :ui="{
              list: 'w-48',
            }"
          />

          <div v-if="isAuthenticated" class="mt-auto">
            <User />
          </div>
        </div>
      </UContainer>
    </template>
  </ClientOnly>
</template>
