<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
  settings?: {
    enableBatching: boolean;
    batchSize: number;
  };
}>();

const emit = defineEmits<{
  save: [];
}>();

const batchingSchema = z.object({
  enableBatching: z.boolean(),
  batchSize: z.number().int().min(1, 'Min 1').max(100, 'Max 100'),
});

const batchingState = reactive({
  enableBatching: props.settings?.enableBatching ?? true,
  batchSize: props.settings?.batchSize ?? 10,
});

// Initial state for comparison
const initialBatchingState = reactive({
  enableBatching: props.settings?.enableBatching ?? true,
  batchSize: props.settings?.batchSize ?? 10,
});

// Form validation errors
const formErrors = ref<unknown[]>([]);

// Form state management
const { isButtonDisabled, updateInitialData } = useFormState({
  initialData: initialBatchingState,
  currentData: toRef(batchingState),
  errors: formErrors,
});

defineExpose({
  batchingState,
  updateInitialData: () => updateInitialData(batchingState),
});

function saveBatchingSettings() {
  emit('save');
}
</script>

<template>
  <UForm
    :schema="batchingSchema"
    :state="batchingState"
    class="space-y-8"
    @submit="saveBatchingSettings"
  >
    <div class="space-y-6">
      <UFormGroup
        class="flex flex-col"
        name="enableBatching"
        description="Group multiple notifications together to reduce frequency and improve readability"
      >
        <UCheckbox
          v-model="batchingState.enableBatching"
          name="enableBatching"
          label="Enable Notification Batching"
          size="md"
        />
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Group multiple notifications together to reduce frequency and improve
          readability
        </p>
      </UFormGroup>

      <UFormGroup
        class="flex flex-col"
        label="Batch Size"
        description="Number of notifications to send in one batch (1-100)"
        name="batchSize"
        :disabled="!batchingState.enableBatching"
      >
        <label
          for="batchSize"
          class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          :class="{ 'opacity-50': !batchingState.enableBatching }"
        >
          Batch Size
        </label>
        <UInput
          v-model.number="batchingState.batchSize"
          type="number"
          :min="1"
          :max="100"
          :disabled="!batchingState.enableBatching"
          placeholder="10"
          icon="heroicons:squares-2x2"
          size="md"
          class="w-40"
        />
        <p
          class="text-xs text-neutral-500 dark:text-neutral-400 mb-1"
          :class="{ 'opacity-50': !batchingState.enableBatching }"
        >
          Number of notifications to send in one batch (1-100)
        </p>
      </UFormGroup>
    </div>

    <UDivider class="my-8" />

    <div class="flex justify-end pt-4">
      <UButton
        type="submit"
        icon="heroicons:check"
        size="md"
        :loading="props.isSaving"
        :disabled="isButtonDisabled"
      >
        Save Settings
      </UButton>
    </div>
  </UForm>
</template>
