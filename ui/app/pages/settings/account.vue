<script lang="ts" setup>
definePageMeta({
  layout: 'default',
});
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="max-w-4xl mx-auto">
      <header class="mb-8">
        <h1 class="text-2xl font-bold">Account Settings</h1>
        <p class="text-neutral-500 mt-2">
          Manage your account information and preferences
        </p>
      </header>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Profile Information</h2>
          </template>
          <div class="space-y-4">
            <!-- Add profile settings controls here -->
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Security</h2>
          </template>
          <div class="space-y-4">
            <!-- Add security settings controls here -->
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Account Management</h2>
          </template>
          <div class="space-y-4">
            <!-- Add account management controls here -->
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
