<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading?: boolean;
  isSaving?: boolean;
}>();

const emit = defineEmits<{
  save: [];
}>();

const _securitySchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const securityState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Initial state for comparison
const initialSecurityState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Form validation errors
const formErrors = ref<unknown[]>([]);

// Form state management
const { isButtonDisabled, updateInitialData } = useFormState({
  initialData: initialSecurityState,
  currentData: toRef(securityState),
  errors: formErrors,
});

defineExpose({
  securityState,
  updateInitialData: () => updateInitialData(securityState),
});

function saveSecuritySettings() {
  emit('save');
}
</script>

<template>
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
          v-model="securityState.currentPassword"
          type="password"
          placeholder="••••••••"
        />
        <p class="text-xs text-neutral-500 mt-1">Enter your current password</p>
      </div>

      <div class="mb-4">
        <div class="mb-1">
          <label for="new-password" class="block font-medium text-sm"
            >New Password</label
          >
        </div>
        <UInput
          id="new-password"
          v-model="securityState.newPassword"
          type="password"
          placeholder="••••••••"
        />
        <p class="text-xs text-neutral-500 mt-1">Enter a new secure password</p>
      </div>

      <div class="mb-4">
        <div class="mb-1">
          <label for="confirm-password" class="block font-medium text-sm"
            >Confirm New Password</label
          >
        </div>
        <UInput
          id="confirm-password"
          v-model="securityState.confirmPassword"
          type="password"
          placeholder="••••••••"
        />
        <p class="text-xs text-neutral-500 mt-1">
          Re-enter your new password to confirm
        </p>
      </div>

      <div class="flex justify-end">
        <UButton
          :loading="props.isSaving"
          :disabled="isButtonDisabled"
          @click="saveSecuritySettings"
          >Change Password</UButton
        >
      </div>
    </div>
  </UCard>
</template>
