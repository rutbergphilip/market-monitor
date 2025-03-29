<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';

const items = ref<NavigationMenuItem[][]>([
  [
    {
      label: 'Watchers',
      icon: 'i-lucide-house',
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
    class="flex flex-col h-screen py-5 gap-5 bg-neutral-800 border-r-[1px] border-r-gray-100 dark:border-r-gray-700"
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
      v-if="!isCollapsed"
      orientation="vertical"
      :items="items"
      class="data-[orientation=vertical]:w-48"
    />

    <footer v-if="!isCollapsed" class="mt-auto">
      <p>Signed in</p>
    </footer>
  </UContainer>
</template>
