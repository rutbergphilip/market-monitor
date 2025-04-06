<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading?: boolean;
  isSaving?: boolean;
  settings?: {
    email?: string;
    username?: string;
  };
}>();

const emit = defineEmits<{
  save: [];
}>();

const _profileSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(1, 'Username is required'),
});

const profileState = reactive({
  email: props.settings?.email || '',
  username: props.settings?.username || '',
});

defineExpose({
  profileState,
});

function saveProfileSettings() {
  emit('save');
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Profile Information</h2>
    </template>
    <div class="space-y-4">
      <div class="mb-4">
        <div class="mb-1">
          <label for="email" class="block font-medium text-sm"
            >Email Address</label
          >
        </div>
        <UInput
          id="email"
          v-model="profileState.email"
          type="email"
          placeholder="your.email@example.com"
        />
        <p class="text-xs text-neutral-500 mt-1">
          Your email address for notifications and account recovery
        </p>
      </div>

      <div class="mb-4">
        <div class="mb-1">
          <label for="display-name" class="block font-medium text-sm"
            >Username</label
          >
        </div>
        <UInput
          id="display-name"
          v-model="profileState.username"
          placeholder="Your username"
        />
        <p class="text-xs text-neutral-500 mt-1">
          Used for sign in and display in the app
        </p>
      </div>

      <div class="flex justify-end">
        <UButton :loading="props.isSaving" @click="saveProfileSettings"
          >Save Profile Information</UButton
        >
      </div>
    </div>
  </UCard>
</template>
