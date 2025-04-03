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
            <div class="mb-4">
              <div class="mb-1">
                <label for="display-name" class="block font-medium text-sm"
                  >Display Name</label
                >
              </div>
              <UInput id="display-name" placeholder="Your name" />
              <p class="text-xs text-neutral-500 mt-1">
                Your name as displayed in the application
              </p>
            </div>

            <div class="mb-4">
              <div class="mb-1">
                <label for="email" class="block font-medium text-sm"
                  >Email Address</label
                >
              </div>
              <UInput
                id="email"
                type="email"
                placeholder="your.email@example.com"
              />
              <p class="text-xs text-neutral-500 mt-1">
                Your email address for notifications and account recovery
              </p>
            </div>

            <div class="flex justify-end">
              <UButton>Save Profile Information</UButton>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Security</h2>
          </template>
          <div class="space-y-4">
            <div class="mb-4">
              <div class="mb-1">
                <label for="current-password" class="block font-medium text-sm"
                  >Current Password</label
                >
              </div>
              <UInput
                id="current-password"
                type="password"
                placeholder="••••••••"
              />
              <p class="text-xs text-neutral-500 mt-1">
                Enter your current password
              </p>
            </div>

            <div class="mb-4">
              <div class="mb-1">
                <label for="new-password" class="block font-medium text-sm"
                  >New Password</label
                >
              </div>
              <UInput
                id="new-password"
                type="password"
                placeholder="••••••••"
              />
              <p class="text-xs text-neutral-500 mt-1">
                Enter a new secure password
              </p>
            </div>

            <div class="mb-4">
              <div class="mb-1">
                <label for="confirm-password" class="block font-medium text-sm"
                  >Confirm New Password</label
                >
              </div>
              <UInput
                id="confirm-password"
                type="password"
                placeholder="••••••••"
              />
              <p class="text-xs text-neutral-500 mt-1">
                Re-enter your new password to confirm
              </p>
            </div>

            <div class="flex justify-end">
              <UButton>Change Password</UButton>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Account Management</h2>
          </template>
          <div class="space-y-4">
            <div class="mb-4">
              <div class="mb-1">
                <label class="block font-medium text-sm"
                  >Email Preferences</label
                >
              </div>
              <div class="mt-2">
                <div class="flex items-center space-x-2 mb-2">
                  <UCheckbox id="email-notifications" />
                  <label for="email-notifications"
                    >Receive email notifications</label
                  >
                </div>
                <div class="flex items-center space-x-2">
                  <UCheckbox id="email-marketing" />
                  <label for="email-marketing">Receive marketing emails</label>
                </div>
              </div>
              <p class="text-xs text-neutral-500 mt-1">
                Manage what types of emails you receive
              </p>
            </div>

            <div class="mb-4">
              <div class="mb-1">
                <label class="block font-medium text-sm">Danger Zone</label>
              </div>
              <div
                class="mt-2 p-4 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20"
              >
                <p class="text-sm text-red-800 dark:text-red-200 mb-3">
                  Deleting your account will remove all your data and cannot be
                  undone.
                </p>
                <UButton color="error" variant="solid">Delete Account</UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
