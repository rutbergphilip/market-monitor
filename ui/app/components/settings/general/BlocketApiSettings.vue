<script lang="ts" setup>
import { reactive, ref, toRef } from 'vue';
import * as z from 'zod';

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
  settings?: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  };
}>();

const emit = defineEmits<{
  save: [];
}>();

const blocketApiSchema = z.object({
  maxRetries: z.number().int().min(1, 'Min 1').max(10, 'Max 10'),
  retryDelay: z.number().int().min(500, 'Min 500ms').max(10000, 'Max 10s'),
  timeout: z.number().int().min(5000, 'Min 5s').max(60000, 'Max 60s'),
});

const blocketApiState = reactive({
  maxRetries: props.settings?.maxRetries || 5,
  retryDelay: props.settings?.retryDelay || 3000,
  timeout: props.settings?.timeout || 15000,
});

// Initial state for comparison
const initialBlocketApiState = reactive({
  maxRetries: props.settings?.maxRetries || 5,
  retryDelay: props.settings?.retryDelay || 3000,
  timeout: props.settings?.timeout || 15000,
});

// Form validation errors
const formErrors = ref<unknown[]>([]);

// Form state management
const { isButtonDisabled, updateInitialData } = useFormState({
  initialData: initialBlocketApiState,
  currentData: toRef(blocketApiState),
  errors: formErrors,
});

defineExpose({
  blocketApiState,
  updateInitialData: () => updateInitialData(blocketApiState),
});

function saveBlocketApiSettings() {
  emit('save');
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center">
        <UIcon name="ic:baseline-network-check" class="mr-2 text-xl" />
        <h2 class="text-lg font-semibold">Blocket API Settings</h2>
      </div>
    </template>
    <UForm
      :schema="blocketApiSchema"
      :state="blocketApiState"
      class="space-y-4"
      @submit="saveBlocketApiSettings"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div class="mb-1">
            <label for="max-retries" class="block font-medium text-sm"
              >Max Retries</label
            >
          </div>
          <UInput
            id="max-retries"
            v-model.number="blocketApiState.maxRetries"
            type="number"
            :min="1"
            :max="10"
          />
          <p class="text-xs text-neutral-500 mt-1">
            Maximum retry attempts for failed API calls
          </p>
        </div>

        <div>
          <div class="mb-1">
            <label for="retry-delay" class="block font-medium text-sm"
              >Retry Delay (ms)</label
            >
          </div>
          <UInput
            id="retry-delay"
            v-model.number="blocketApiState.retryDelay"
            type="number"
            :min="500"
            :max="10000"
          />
          <p class="text-xs text-neutral-500 mt-1">
            Base delay between retry attempts
          </p>
        </div>

        <div>
          <div class="mb-1">
            <label for="timeout" class="block font-medium text-sm"
              >Timeout (ms)</label
            >
          </div>
          <UInput
            id="timeout"
            v-model.number="blocketApiState.timeout"
            type="number"
            :min="5000"
            :max="60000"
          />
          <p class="text-xs text-neutral-500 mt-1">
            API request timeout duration
          </p>
        </div>
      </div>

      <div
        class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md"
      >
        <div class="flex items-start">
          <UIcon
            name="i-heroicons-information-circle"
            class="text-blue-600 dark:text-blue-400 mr-2 mt-0.5"
          />
          <div>
            <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
              Network Resilience Settings
            </p>
            <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
              These settings help handle network connectivity issues with the
              Blocket API. Higher values provide better resilience but may slow
              down watcher execution during outages.
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-4">
        <UButton
          type="submit"
          :loading="props.isSaving"
          :disabled="isButtonDisabled"
          >Save API Settings</UButton
        >
      </div>
    </UForm>
  </UCard>
</template>
