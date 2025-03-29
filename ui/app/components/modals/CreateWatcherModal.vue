<script lang="ts" setup>
import cronstrue from 'cronstrue';
import * as z from 'zod';

import { SCHEDULE_PRESETS } from '~/constants';

import type { FormError, FormSubmitEvent } from '@nuxt/ui';
import type { Watcher } from '~/types';

defineEmits(['cancel', 'success']);

const toast = useToast();

const metadataOpen = ref(false);

const schema = z.object({
  query: z.string().min(1, 'Required'),
  schedule: z.string().min(1, 'Required'),
});

type Schema = z.output<typeof schema>;

const state = reactive<Watcher>({
  query: '',
  schedule: '',
  notifications: [],
});

const schedule = computed(() =>
  cronstrue.toString(state.schedule, { throwExceptionOnParseError: false }) ===
  'An error occurred when generating the expression description. Check the cron expression syntax.'
    ? 'Invalid cron expression'
    : cronstrue.toString(state.schedule, { throwExceptionOnParseError: false })
);

const validate = (state: any): FormError[] => {
  const errors = [];
  if (!state.query) errors.push({ name: 'query', message: 'Required' });
  if (schedule.value === 'Invalid cron expression')
    errors.push({ name: 'schedule', message: 'Required' });
  return errors;
};

async function create(event: FormSubmitEvent<Schema>) {
  console.log('Creating watcher...', event);
  toast.add({
    title: 'Success',
    description: 'The form has been submitted.',
    color: 'success',
  });
}

function selectPreset(preset: { cron: string; label: string }) {
  state.schedule = preset.cron;

  // Briefly focuses and blurs the input to trigger validation
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>(
      'input[name="schedule"]'
    );
    if (input) {
      input.focus();
      input.select();
      input.blur();
    }
  });
}
</script>

<template>
  <UModal>
    <template #header> Create Watcher </template>

    <template #body>
      <UForm
        :schema="schema"
        :validate="validate"
        :state="state"
        class="space-y-4 w-full"
        @submit="create"
      >
        <UFormField label="Watcher query" name="query">
          <UInput
            v-model="state.query"
            size="xl"
            class="w-full"
            placeholder="Macbook Pro"
          />
        </UFormField>

        <UFormField label="Schedule" name="schedule">
          <UInput
            v-model="state.schedule"
            size="xl"
            type="text"
            class="w-full"
            placeholder="*/5 * * * *"
          />
        </UFormField>

        <div class="flex flex-col gap-2">
          <p>{{ state.schedule.length ? schedule : '' }}</p>
          <p class="text-sm text-neutral-500">Quick presets:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="preset in SCHEDULE_PRESETS"
              :key="preset.cron"
              class="cursor-pointer hover:bg-neutral-700"
              variant="subtle"
              :color="state.schedule === preset.cron ? 'primary' : 'neutral'"
              @click="selectPreset(preset)"
              >{{ preset.label }}</UBadge
            >
          </div>
        </div>

        <UCollapsible :open="metadataOpen" class="flex flex-col gap-2 w-full">
          <div
            class="flex items-center gap-2 justify-start cursor-pointer group"
            @click="metadataOpen = !metadataOpen"
          >
            <UIcon
              name="material-symbols:add-2"
              class="text-neutral-500 group-hover:text-neutral-300 transition-transform duration-300"
              :class="{ 'rotate-45': metadataOpen }"
              size="1.25rem"
            />
            <p
              class="text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors"
            >
              Metadata
            </p>
          </div>

          <template #content>
            <UFormField label="Notifications" name="notifications">
              <UInput class="w-full" />
            </UFormField>
            <div class="flex flex-col gap-2 w-full">
              <div
                v-for="item in state.notifications"
                :key="item"
                class="flex gap-2 grow"
              >
                <UButton color="error" size="xs" icon="i-lucide-trash" />
                <p class="text-sm text-neutral-500">
                  {{ item }}
                </p>
              </div>
            </div>
          </template>
        </UCollapsible>

        <USeparator />

        <div class="flex gap-2 w-full justify-end">
          <UButton color="neutral" @click="$emit('cancel')"> Cancel </UButton>
          <UButton aria-label="Create watcher" type="submit"> Create </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
