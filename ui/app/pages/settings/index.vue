<script setup>
definePageMeta({
  middleware: 'auth',
  layout: 'default',
});

useHead({
  title: 'Settings',
});

const settingsPages = [
  {
    title: 'General',
    description: 'General application settings and preferences',
    icon: 'i-lucide-settings',
    to: '/settings/general',
  },
  {
    title: 'Notifications',
    description: 'Configure notification settings and preferences',
    icon: 'i-lucide-bell',
    to: '/settings/notifications',
  },
  {
    title: 'Account',
    description: 'Manage your account information and security',
    icon: 'i-lucide-user',
    to: '/settings/account',
  },
];
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Manage your application settings and preferences
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="page in settingsPages"
        :key="page.to"
        :to="page.to"
        class="block"
      >
        <UCard
          class="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 h-full"
          :ui="{
            body: { padding: 'p-6' },
          }"
        >
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 mt-1">
              <UIcon :name="page.icon" class="h-8 w-8 text-primary-500" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ page.title }}
              </h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ page.description }}
              </p>
            </div>
            <div class="flex-shrink-0">
              <UIcon
                name="i-lucide-chevron-right"
                class="h-5 w-5 text-gray-400"
              />
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </div>
</template>
