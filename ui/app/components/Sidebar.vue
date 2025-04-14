<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';

const watcherStore = useWatcherStore();
const authStore = useAuthStore();
const router = useRouter();

const { activeWatchers } = storeToRefs(watcherStore);
const { isAuthenticated } = storeToRefs(authStore);

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

const isCollapsed = ref(false);
provide('sidebarCollapsed', isCollapsed);

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<template>
  <UContainer
    class="flex flex-col h-dvh py-5 gap-5 bg-neutral-900 border-r-[1px] border-r-neutral-800 dark:border-r-neutral-700 fixed left-0 top-0 z-10"
    :class="{ 'w-16': isCollapsed, 'w-60': !isCollapsed }"
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
        <UTooltip
          :text="authStore.user?.username || 'User'"
          :delay-duration="250"
          :content="{ side: 'right' }"
        >
          <UAvatar
            :src="authStore.user?.avatarUrl"
            :alt="authStore.user?.username || 'User'"
            :text="(authStore.user?.username?.[0] || 'U').toUpperCase()"
            size="sm"
            class="cursor-pointer"
            @click="router.push('/settings/account')"
          />
        </UTooltip>
      </div>
    </div>
  </UContainer>
</template>
