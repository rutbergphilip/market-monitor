<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading?: boolean;
  isSaving?: boolean;
  settings?: {
    tokenExpiry?: string;
  };
}>();

const emit = defineEmits<{
  save: [];
}>();

const _tokenSchema = z.object({
  tokenExpiry: z
    .string()
    .min(1, 'Token expiry is required')
    .refine(
      (value) =>
        [
          '1m',
          '1h',
          '6h',
          '12h',
          '24h',
          '48h',
          '7d',
          '30d',
          '90d',
          'never',
        ].includes(value),
      'Please select a valid token expiry option'
    ),
});

const tokenState = reactive({
  tokenExpiry: props.settings?.tokenExpiry || '48h',
});

defineExpose({
  tokenState,
});

function saveTokenSettings() {
  emit('save');
}

// Predefined options for common token expiry times
const expiryOptions = [
  { value: '1m', label: '1 minute' },
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '12h', label: '12 hours' },
  { value: '24h', label: '1 day' },
  { value: '48h', label: '2 days (default)' },
  { value: '7d', label: '1 week' },
  { value: '30d', label: '1 month' },
  { value: '90d', label: '3 months' },
  { value: 'never', label: 'Never expire' },
];
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Token Settings</h2>
    </template>
    <div class="space-y-4">
      <div class="mb-4">
        <div class="mb-1">
          <label for="token-expiry" class="block font-medium text-sm"
            >Login Token Expiry</label
          >
        </div>
        <div class="flex flex-col gap-2">
          <USelectMenu
            id="token-expiry"
            v-model="tokenState.tokenExpiry"
            :items="expiryOptions"
            value-key="value"
            class="w-1/3"
          />
          <p class="text-xs text-neutral-500">
            How long before users need to sign in again.
          </p>
        </div>
      </div>

      <div
        v-if="tokenState.tokenExpiry === 'never'"
        class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
      >
        <div class="flex items-start">
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5"
          />
          <div>
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Security Warning
            </p>
            <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Tokens that never expire pose a security risk. If a token is
              compromised, it will remain valid indefinitely. Consider using a
              long expiration time instead (e.g., 30d).
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <UButton :loading="props.isSaving" @click="saveTokenSettings">
          Save Token Settings
        </UButton>
      </div>
    </div>
  </UCard>
</template>
