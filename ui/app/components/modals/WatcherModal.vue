<script lang="ts" setup>
import cronstrue from 'cronstrue';
import * as z from 'zod';

import {
  SCHEDULE_PRESETS,
  NOTIFICATION_TARGETS,
  NOTIFICATION_ICON_MAP,
  DISABLED_NOTIFICATION_TARGETS,
} from '~/constants';

import type { FormError, FormSubmitEvent } from '@nuxt/ui';
import type { NotificationKind, Notification, Watcher } from '~/types';

const emit = defineEmits(['cancel', 'success']);
const props = defineProps({
  watcher: { type: Object as PropType<Watcher>, required: false },
});

const watcherStore = useWatcherStore();
const toast = useToast();
const { copy } = useClipboard();

const metadataOpen = ref(false);

const schema = z.object({
  query: z.string().min(1, 'Required'),
  schedule: z.string().min(1, 'Required'),
});

type Schema = z.output<typeof schema>;

const selectedNotificationType = ref<NotificationKind>('DISCORD');
const notificationInput = ref('');
const state = reactive<Watcher>({
  query: props.watcher?.query ?? '',
  schedule: props.watcher?.schedule ?? '',
  notifications: props.watcher?.notifications ?? [],
  min_price: props.watcher?.min_price ?? null,
  max_price: props.watcher?.max_price ?? null,
});

const schedule = computed(() =>
  cronstrue.toString(state.schedule, { throwExceptionOnParseError: false }) ===
  'An error occurred when generating the expression description. Check the cron expression syntax.'
    ? 'Invalid cron expression'
    : cronstrue.toString(state.schedule, { throwExceptionOnParseError: false })
);

const validate = (state: Partial<Watcher>): FormError[] => {
  const errors: FormError[] = [];
  if (!state.query) errors.push({ name: 'query', message: 'Required' });
  if (schedule.value === 'Invalid cron expression')
    errors.push({ name: 'schedule', message: 'Required' });
  return errors;
};

onMounted(() => {
  if (props.watcher) {
    state.query = props.watcher.query;
    state.schedule = props.watcher.schedule;
    state.notifications = [...props.watcher.notifications];
    state.min_price = props.watcher.min_price ?? null;
    state.max_price = props.watcher.max_price ?? null;
  }
});

async function save(event: FormSubmitEvent<Schema>) {
  if (props.watcher) {
    await update(event);
  } else {
    await create(event);
  }
}

async function create(event: FormSubmitEvent<Schema>) {
  const { query, schedule } = event.data;
  const watcher: Watcher = {
    query,
    schedule,
    notifications: state.notifications ? state.notifications : [],
    min_price: state.min_price,
    max_price: state.max_price,
  };

  try {
    await watcherStore.create(watcher);
    await watcherStore.refresh();
    toast.add({
      title: 'Success',
      description: 'The watcher has been created.',
      color: 'success',
    });
  } catch (error) {
    console.error('Failed to create watcher:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to create the watcher.',
      color: 'error',
    });
  }
  emit('success');
}

async function update(event: FormSubmitEvent<Schema>) {
  const { query, schedule } = event.data;
  const watcher: Watcher = {
    id: props.watcher?.id,
    query,
    schedule,
    notifications: state.notifications ? state.notifications : [],
    min_price: state.min_price,
    max_price: state.max_price,
  };

  try {
    await watcherStore.update(watcher);
    await watcherStore.refresh();
    toast.add({
      title: 'Success',
      description: 'The watcher has been updated.',
      color: 'success',
    });
  } catch (error) {
    console.error('Failed to update watcher:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to update the watcher.',
      color: 'error',
    });
  }
  emit('success');
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

function addNotification() {
  if (!notificationInput.value) {
    toast.add({
      title: 'Error',
      description: 'Please enter a valid notification target',
      color: 'error',
    });
    return;
  }

  let notification: Notification;

  switch (selectedNotificationType.value) {
    case 'EMAIL':
      notification = {
        kind: 'EMAIL',
        email: notificationInput.value,
      };
      break;
    case 'DISCORD':
      notification = {
        kind: 'DISCORD',
        webhook_url: notificationInput.value,
      };
      break;
    default:
      toast.add({
        title: 'Error',
        description: 'Unsupported notification type',
        color: 'error',
      });
      return;
  }

  state.notifications.push(notification);
  notificationInput.value = '';
}

function removeNotification(index: number) {
  state.notifications.splice(index, 1);
}

function getPlaceholderForNotificationType(type: NotificationKind): string {
  switch (type) {
    case 'DISCORD':
      return 'https://discord.com/api/webhooks/your-webhook-url';
    case 'EMAIL':
      return 'example@email.com';
    default:
      return '';
  }
}

function getNotificationValue(notification: Notification): string {
  if ('webhook_url' in notification) {
    return notification.webhook_url;
  } else if ('email' in notification) {
    return notification.email;
  }
  return '';
}
</script>

<template>
  <UModal>
    <template #header>
      {{ $props.watcher ? 'Edit' : 'Create' }} Watcher
    </template>

    <template #body>
      <UForm
        :schema="schema"
        :validate="validate"
        :state="state"
        class="space-y-4 w-full"
        @submit="save"
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

        <!-- Price Range Fields -->
        <div class="flex flex-col gap-4 w-full">
          <p class="text-sm font-medium">Price Range</p>
          <div class="flex gap-4">
            <UFormField
              label="Minimum Price (SEK)"
              name="min_price"
              class="w-full"
            >
              <UInput
                v-model.number="state.min_price"
                type="number"
                min="0"
                placeholder="Enter minimum price"
              />
            </UFormField>
            <UFormField
              label="Maximum Price (SEK)"
              name="max_price"
              class="w-full"
            >
              <UInput
                v-model.number="state.max_price"
                type="number"
                min="0"
                placeholder="Enter maximum price"
              />
            </UFormField>
          </div>
          <p class="text-xs text-neutral-500">
            Set price range to filter out items. Leave empty for no price
            filtering.
          </p>
        </div>

        <div class="h-2" />

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
              Notification Settings
            </p>
          </div>

          <template #content>
            <UFormField label="Notifications" name="notifications">
              <div class="flex flex-col gap-3 w-full">
                <!-- Notification Type Selector -->
                <UButtonGroup>
                  <UButton
                    v-for="type in NOTIFICATION_TARGETS"
                    :key="type"
                    size="sm"
                    :icon="NOTIFICATION_ICON_MAP[type]"
                    :color="
                      selectedNotificationType === type ? 'primary' : 'neutral'
                    "
                    :variant="
                      selectedNotificationType === type ? 'solid' : 'ghost'
                    "
                    :disabled="DISABLED_NOTIFICATION_TARGETS.includes(type)"
                    @click="selectedNotificationType = type"
                  >
                    {{ type }}
                  </UButton>
                </UButtonGroup>

                <!-- Input Field with Add Button -->
                <div class="flex gap-2 items-center">
                  <UInput
                    v-model="notificationInput"
                    class="w-full"
                    :placeholder="
                      getPlaceholderForNotificationType(
                        selectedNotificationType
                      )
                    "
                    @keyup.enter="addNotification"
                  />
                  <UButton
                    color="primary"
                    icon="i-heroicons-plus"
                    @click="addNotification"
                  >
                    Add
                  </UButton>
                </div>

                <!-- List of Added Notifications -->
                <div
                  v-if="state.notifications.length"
                  class="flex flex-col gap-2 mt-2 p-3 bg-gray-800 rounded-md"
                >
                  <p class="text-xs text-neutral-400 mb-1 font-medium">
                    Added Notifications ({{ state.notifications.length }})
                  </p>
                  <div
                    v-for="(notification, index) in state.notifications"
                    :key="index"
                    class="flex items-center justify-between px-3 py-2 bg-gray-700 rounded"
                  >
                    <div class="flex items-center gap-2">
                      <UIcon
                        :name="NOTIFICATION_ICON_MAP[notification.kind]"
                        class="text-neutral-400"
                      />
                      <p
                        class="text-sm text-neutral-300 truncate max-w-[230px]"
                      >
                        {{ getNotificationValue(notification) }}
                      </p>
                    </div>
                    <div class="flex gap-1">
                      <UButton
                        color="primary"
                        icon="i-heroicons-clipboard-document"
                        variant="ghost"
                        aria-label="Copy notification"
                        @click="
                          copy(getNotificationValue(notification));
                          toast.add({
                            title: 'Copied!',
                            description: 'Notification copied to clipboard',
                            color: 'success',
                            duration: 2000,
                          });
                        "
                      />
                      <UButton
                        color="error"
                        icon="i-heroicons-trash"
                        variant="ghost"
                        aria-label="Remove notification"
                        @click="removeNotification(index)"
                      />
                    </div>
                  </div>
                </div>

                <div v-else class="text-sm text-neutral-500 mt-1">
                  No notifications added yet. Add at least one to receive
                  updates.
                </div>
              </div>
            </UFormField>
          </template>
        </UCollapsible>

        <USeparator />

        <div class="flex gap-2 w-full justify-end">
          <UButton color="neutral" @click="$emit('cancel')"> Cancel </UButton>
          <UButton
            :aria-label="$props.watcher ? 'Edit' : 'Create'"
            type="submit"
          >
            {{ $props.watcher ? 'Update' : 'Create' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
