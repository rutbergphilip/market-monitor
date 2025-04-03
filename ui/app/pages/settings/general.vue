<script lang="ts" setup>
definePageMeta({
  layout: 'default',
});
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="max-w-4xl mx-auto">
      <header class="mb-8">
        <h1 class="text-2xl font-bold">General Settings</h1>
        <p class="text-neutral-500 mt-2">
          Configure your general application settings
        </p>
      </header>

      <div class="space-y-6">
        <!-- Settings content will go here -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Application Preferences</h2>
          </template>
          <div class="space-y-4">
            <!-- Add settings controls here -->
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
