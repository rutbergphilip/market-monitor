<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  save: [];
}>();

const batchingSchema = z.object({
  enableBatching: z.boolean(),
  batchSize: z.number().int().min(1, 'Min 1').max(100, 'Max 100'),
});

const batchingState = reactive({
  enableBatching: true,
  batchSize: 10,
});

defineExpose({
  batchingState,
});

function saveBatchingSettings() {
  emit('save');
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center">
        <UIcon name="i-lucide-layers" class="mr-2 text-xl" />
        <h2 class="text-lg font-semibold">Notification Batching</h2>
      </div>
    </template>
    <UForm
      :schema="batchingSchema"
      :state="batchingState"
      class="space-y-4"
      @submit="saveBatchingSettings"
    >
      <div class="flex items-center space-x-2 mb-4">
        <UCheckbox
          id="enable-batching"
          v-model="batchingState.enableBatching"
          name="enableBatching"
        />
        <label for="enable-batching" class="font-medium"
          >Enable Notification Batching</label
        >
      </div>

      <div class="mb-4">
        <div class="mb-1">
          <label for="batch-size" class="block font-medium text-sm"
            >Batch Size</label
          >
        </div>
        <UInput
          id="batch-size"
          v-model.number="batchingState.batchSize"
          type="number"
          :min="1"
          :max="100"
          :disabled="!batchingState.enableBatching"
        />
        <p class="text-xs text-neutral-500 mt-1">
          Number of notifications to send in one batch
        </p>
      </div>

      <div class="flex justify-end">
        <UButton type="submit" :loading="props.isSaving">
          Save Batching Settings
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
