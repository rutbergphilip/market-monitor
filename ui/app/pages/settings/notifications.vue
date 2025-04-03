<script lang="ts" setup>
definePageMeta({
  layout: 'default',
});
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="max-w-4xl mx-auto">
      <header class="mb-8">
        <h1 class="text-2xl font-bold">Notification Settings</h1>
        <p class="text-neutral-500 mt-2">
          Manage your notification preferences
        </p>
      </header>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Notification Preferences</h2>
          </template>
          <div class="space-y-4">
            <!-- Add notification settings controls here -->
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Notification Channels</h2>
          </template>
          <div class="space-y-4">
            <!-- Add notification channel settings here -->
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
