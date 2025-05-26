<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
  settings?: {
    limit?: number;
    maxPages?: number;
    sort?: string;
    listingType?: string;
    status?: string;
    geolocation?: number;
    include?: string;
  };
}>();

const emit = defineEmits<{
  save: [];
}>();

const blocketQuerySchema = z.object({
  limit: z.number().int().min(1, 'Min 1').max(60, 'Max 60'),
  maxPages: z.number().int().min(1, 'Min 1').max(10, 'Max 10'),
  sort: z.enum(['rel']),
  listingType: z.enum(['s']),
  status: z.enum(['active']),
  geolocation: z.number().int().min(3, 'Min 3').max(3, 'Max 3'),
  include: z.string(),
});

const blocketQueryState = reactive({
  limit: props.settings?.limit || 60,
  maxPages: props.settings?.maxPages || 3,
  sort: props.settings?.sort || 'rel',
  listingType: props.settings?.listingType || 's',
  status: props.settings?.status || 'active',
  geolocation: props.settings?.geolocation || 3,
  include: props.settings?.include || 'extend_with_shipping',
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div class="mb-1">
            <label for="results-limit" class="block font-medium text-sm"
              >Results Limit (per page)</label
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
            Maximum number of results to fetch per page
          </p>
        </div>

        <div>
          <div class="mb-1">
            <label for="max-pages" class="block font-medium text-sm"
              >Max Pages</label
            >
          </div>
          <UInput
            id="max-pages"
            v-model.number="blocketQueryState.maxPages"
            type="number"
            :min="1"
            :max="10"
          />
          <p class="text-xs text-neutral-500 mt-1">
            Maximum number of pages to fetch per query (prevents excessive API
            calls)
          </p>
        </div>
      </div>

      <div
        class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md"
      >
        <div class="flex items-start">
          <UIcon
            name="i-heroicons-information-circle"
            class="text-blue-600 dark:text-blue-400 mr-2 mt-0.5"
          />
          <div>
            <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
              Pagination Control
            </p>
            <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Limiting pages prevents excessive API calls and reduces load on
              Blocket's servers. Each page can contain up to
              {{ blocketQueryState.limit }} results, so
              {{ blocketQueryState.maxPages }} pages can yield up to
              {{ blocketQueryState.limit * blocketQueryState.maxPages }} results
              per query.
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-4">
        <UButton type="submit" :loading="props.isSaving"
          >Save Query Settings</UButton
        >
      </div>
    </UForm>
  </UCard>
</template>
