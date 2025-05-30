<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading?: boolean;
  isSaving?: boolean;
  settings?: {
    email?: string;
    username?: string;
    avatarUrl?: string;
  };
}>();

const emit = defineEmits<{
  save: [];
}>();

const _profileSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(1, 'Username is required'),
  avatarUrl: z.string().url('Invalid URL format').or(z.literal('')),
});

const profileState = reactive({
  email: props.settings?.email || '',
  username: props.settings?.username || '',
  avatarUrl: props.settings?.avatarUrl || '',
});

// Initial state for comparison
const initialProfileState = reactive({
  email: props.settings?.email || '',
  username: props.settings?.username || '',
  avatarUrl: props.settings?.avatarUrl || '',
});

// Form validation errors
const formErrors = ref<unknown[]>([]);

// Form state management
const { isButtonDisabled, updateInitialData } = useFormState({
  initialData: initialProfileState,
  currentData: toRef(profileState),
  errors: formErrors,
});

defineExpose({
  profileState,
  updateInitialData: () => updateInitialData(profileState),
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
          class="w-3/4"
        />
        <p class="text-xs text-neutral-500 mt-1">
          Your email address for notifications
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
          class="w-3/4"
        />
        <p class="text-xs text-neutral-500 mt-1">
          Used for sign in and display in the app
        </p>
      </div>

      <div class="mb-4">
        <div class="mb-1">
          <label for="avatar-url" class="block font-medium text-sm"
            >Avatar URL</label
          >
        </div>
        <UInput
          id="avatar-url"
          v-model="profileState.avatarUrl"
          type="url"
          placeholder="https://example.com/avatar.png"
          class="w-3/4"
        />
        <p class="text-xs text-neutral-500 mt-1">URL of your avatar image</p>
      </div>

      <div class="flex justify-end">
        <UButton
          :loading="props.isSaving"
          :disabled="isButtonDisabled"
          @click="saveProfileSettings"
          >Save Profile Information</UButton
        >
      </div>
    </div>
  </UCard>
</template>
