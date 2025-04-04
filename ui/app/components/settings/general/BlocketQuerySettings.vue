<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  save: [];
}>();

const blocketQuerySchema = z.object({
  limit: z.number().int().min(1, 'Min 1').max(60, 'Max 60'),
  sort: z.enum(['rel']),
  listingType: z.enum(['s']),
  status: z.enum(['active']),
  geolocation: z.number().int().min(3, 'Min 3').max(3, 'Max 3'),
  include: z.string(),
});

const blocketQueryState = reactive({
  limit: 60,
  sort: 'rel',
  listingType: 's',
  status: 'active',
  geolocation: 3,
  include: 'extend_with_shipping',
});

defineExpose({
  blocketQueryState,
});

function saveBlocketQuerySettings() {
  emit('save');
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center">
        <UIcon name="ic:baseline-search" class="mr-2 text-xl" />
        <h2 class="text-lg font-semibold">Blocket Query Settings</h2>
      </div>
    </template>
    <UForm
      :schema="blocketQuerySchema"
      :state="blocketQueryState"
      class="space-y-4"
      @submit="saveBlocketQuerySettings"
    >
      <div class="mb-4">
        <div class="mb-1">
          <label for="results-limit" class="block font-medium text-sm"
            >Results Limit</label
          >
        </div>
        <UInput
          id="results-limit"
          v-model.number="blocketQueryState.limit"
          type="number"
          :min="1"
          :max="60"
        />
        <p class="text-xs text-neutral-500 mt-1">
          Maximum number of results to fetch per query
        </p>
      </div>

      <div class="flex justify-end mt-4">
        <UButton type="submit" :loading="props.isSaving"
          >Save Query Settings</UButton
        >
      </div>
    </UForm>
  </UCard>
</template>
