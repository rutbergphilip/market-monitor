<script lang="ts" setup>
import type { PropType } from 'vue';
import cronstrue from 'cronstrue';
import * as z from 'zod';

import {
  SCHEDULE_PRESETS,
  NOTIFICATION_TARGETS,
  NOTIFICATION_ICON_MAP,
  DISABLED_NOTIFICATION_TARGETS,
} from '~/constants';

import type { FormError, FormSubmitEvent } from '@nuxt/ui';

// Local type definitions - these should match the backend types
type NotificationKind = 'EMAIL' | 'DISCORD';

type EmailNotification = {
  kind: 'EMAIL';
  email: string;
};

type DiscordNotification = {
  kind: 'DISCORD';
  webhook_url: string;
};

type Notification = EmailNotification | DiscordNotification;

type WatcherQuery = {
  id?: string;
  query: string;
  enabled?: boolean;
};

type Watcher = {
  id?: string;
  query: string;
  queries?: WatcherQuery[];
  notifications: Notification[];
  schedule: string;
  status?: 'active' | 'stopped';
  number_of_runs?: number;
  last_run?: string;
  created_at?: string;
  updated_at?: string;
  min_price?: number | null;
  max_price?: number | null;
};

const emit = defineEmits(['cancel', 'success']);
const props = defineProps({
  watcher: {
    type: Object as PropType<Watcher>,
    required: false,
    default: undefined,
  },
});

const watcherStore = useWatcherStore();
const settingsStore = useSettingsStore();
const toast = useToast();
const { copy } = useClipboard();

const metadataOpen = ref(false);

// Discord webhook type
type DiscordWebhook = {
  name: string;
  url: string;
};

// Discord webhooks from settings
const discordWebhooks = computed((): DiscordWebhook[] => {
  try {
    const webhooksJson = settingsStore.getSettingValue(
      'notification.discord.webhooks'
    );
    const parsed = webhooksJson ? JSON.parse(webhooksJson) : [];
    return parsed;
  } catch (error) {
    console.error('Error parsing webhooks:', error);
    return [];
  }
});

// Multiple webhook selection state
const selectedDiscordWebhooks = ref<{ label: string; value: string }[]>([]);

// Discord webhook items for the input menu
const discordWebhookItems = computed(() => {
  return discordWebhooks.value.map((webhook) => ({
    label: webhook.name || 'Unnamed Webhook',
    value: webhook.url,
  }));
});

const schema = z.object({
  query: z.string().min(1, 'Required'),
  schedule: z.string().min(1, 'Required'),
});

type Schema = z.output<typeof schema>;

const selectedNotificationType = ref<NotificationKind>('DISCORD');
const notificationInput = ref('');
const state = reactive<Watcher>({
  query: props.watcher?.query ?? '',
  queries: props.watcher?.queries ?? [],
  schedule: props.watcher?.schedule ?? '',
  notifications: props.watcher?.notifications ?? [],
  min_price: props.watcher?.min_price ?? null,
  max_price: props.watcher?.max_price ?? null,
});

// Local state for managing the queries list
const queriesInput = ref<string>('');
const showMultipleQueries = ref(false);

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

onMounted(async () => {
  // Fetch settings to get Discord webhooks if not already loaded
  if (settingsStore.settings.length === 0) {
    try {
      await settingsStore.fetchSettings();
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }

  if (props.watcher) {
    state.query = props.watcher.query;
    state.queries = props.watcher.queries ?? [];
    state.schedule = props.watcher.schedule;
    state.notifications = [...props.watcher.notifications];
    state.min_price = props.watcher.min_price ?? null;
    state.max_price = props.watcher.max_price ?? null;

    // Initialize selected Discord webhooks from existing notifications
    const discordNotifications = state.notifications.filter(
      (n) => n.kind === 'DISCORD'
    ) as DiscordNotification[];
    selectedDiscordWebhooks.value = discordNotifications.map((notification) => {
      // Try to find a matching predefined webhook
      const webhook = discordWebhooks.value.find(
        (w) => w.url === notification.webhook_url
      );
      return {
        label: webhook ? webhook.name : `Custom: ${notification.webhook_url}`,
        value: notification.webhook_url,
      };
    });
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
    queries: state.queries,
    schedule,
    notifications: state.notifications ? state.notifications : [],
    min_price: state.min_price,
    max_price: state.max_price,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await watcherStore.create(watcher as any);
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
    queries: state.queries,
    schedule,
    notifications: state.notifications ? state.notifications : [],
    min_price: state.min_price || null,
    max_price: state.max_price || null,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await watcherStore.update(watcher as any);
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

// Query management functions
function addQuery() {
  if (!queriesInput.value.trim()) return;

  const newQuery: WatcherQuery = {
    query: queriesInput.value.trim(),
    enabled: true,
  };

  if (!state.queries) {
    state.queries = [];
  }

  state.queries.push(newQuery);
  queriesInput.value = '';
}

function removeQuery(index: number) {
  if (state.queries && index >= 0 && index < state.queries.length) {
    state.queries.splice(index, 1);
  }
}

function toggleQueryEnabled(index: number) {
  if (
    state.queries &&
    index >= 0 &&
    index < state.queries.length &&
    state.queries[index]
  ) {
    state.queries[index].enabled = !state.queries[index].enabled;
  }
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
      state.notifications.push(notification);
      notificationInput.value = '';
      break;
    case 'DISCORD':
      // Discord notifications are now handled by the input menu
      toast.add({
        title: 'Info',
        description: 'Please use the Discord webhook selector above',
        color: 'info',
      });
      break;
    default:
      toast.add({
        title: 'Error',
        description: 'Unsupported notification type',
        color: 'error',
      });
      return;
  }
}

function removeNotification(index: number) {
  const removedNotification = state.notifications[index];
  state.notifications.splice(index, 1);

  // If it's a Discord notification, also remove it from selectedDiscordWebhooks
  if (removedNotification && removedNotification.kind === 'DISCORD') {
    const webhookUrl = (removedNotification as DiscordNotification).webhook_url;
    selectedDiscordWebhooks.value = selectedDiscordWebhooks.value.filter(
      (webhook) => webhook.value !== webhookUrl
    );
  }
}

// Handle Discord webhook selection from input menu
function onDiscordWebhookSelect(webhooks: { label: string; value: string }[]) {
  // Update Discord notifications based on selected webhooks
  const discordNotifications: DiscordNotification[] = webhooks.map(
    (webhook) => ({
      kind: 'DISCORD',
      webhook_url: webhook.value,
    })
  );

  // Remove existing Discord notifications and add new ones
  const nonDiscordNotifications = state.notifications.filter(
    (n) => n.kind !== 'DISCORD'
  );
  state.notifications = [...nonDiscordNotifications, ...discordNotifications];
}

// Handle custom Discord webhook creation
function onCreateDiscordWebhook(customWebhookUrl: string) {
  // Basic validation for Discord webhook URL
  if (!customWebhookUrl.includes('discord.com/api/webhooks/')) {
    toast.add({
      title: 'Invalid webhook URL',
      description: 'Please enter a valid Discord webhook URL',
      color: 'error',
    });
    return;
  }

  // Create a new webhook item
  const newWebhookItem = {
    label: `Custom: ${customWebhookUrl.split('/').pop()?.substring(0, 20)}...`,
    value: customWebhookUrl,
  };

  // Add to selected webhooks
  selectedDiscordWebhooks.value = [
    ...selectedDiscordWebhooks.value,
    newWebhookItem,
  ];

  // Add to notifications
  const newNotification: DiscordNotification = {
    kind: 'DISCORD',
    webhook_url: customWebhookUrl,
  };
  state.notifications.push(newNotification);

  toast.add({
    title: 'Custom webhook added',
    description: 'Discord webhook has been added',
    color: 'success',
    duration: 3000,
  });
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

// Watch for notification type changes to clear input
watch(selectedNotificationType, () => {
  notificationInput.value = '';
});
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

        <!-- Multiple Queries Section -->
        <div class="flex flex-col gap-4 w-full">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">Additional Search Queries</p>
            <UButton
              size="sm"
              variant="outline"
              icon="i-heroicons-plus"
              @click="
                () => {
                  queriesInput = '';
                  showMultipleQueries = !showMultipleQueries;
                }
              "
            >
              {{ showMultipleQueries ? 'Hide' : 'Add More' }}
            </UButton>
          </div>

          <!-- Input for adding new queries -->
          <div v-if="showMultipleQueries" class="flex gap-2 items-center">
            <UInput
              v-model="queriesInput"
              class="w-full"
              placeholder="Enter additional search term (e.g. iPhone 15)"
              @keyup.enter="addQuery"
            />
            <UButton
              color="primary"
              icon="i-heroicons-plus"
              :disabled="!queriesInput.trim()"
              @click="addQuery"
            >
              Add
            </UButton>
          </div>

          <!-- List of added queries -->
          <div
            v-if="state.queries && state.queries.length > 0"
            class="flex flex-col gap-2 p-3 bg-gray-800 rounded-md"
          >
            <p class="text-xs text-neutral-400 mb-1 font-medium">
              Additional Queries ({{ state.queries.length }})
            </p>
            <div
              v-for="(query, index) in state.queries"
              :key="index"
              class="flex items-center justify-between px-3 py-2 bg-gray-700 rounded"
            >
              <div class="flex items-center gap-2">
                <UToggle
                  :value="query.enabled !== false"
                  @update:value="toggleQueryEnabled(index)"
                />
                <p
                  class="text-sm truncate max-w-[230px]"
                  :class="
                    query.enabled === false
                      ? 'text-neutral-500 line-through'
                      : 'text-neutral-300'
                  "
                >
                  {{ query.query }}
                </p>
              </div>
              <UButton
                color="error"
                icon="i-heroicons-trash"
                variant="ghost"
                size="sm"
                aria-label="Remove query"
                @click="removeQuery(index)"
              />
            </div>
          </div>

          <p class="text-xs text-neutral-500">
            Add multiple search terms to monitor different variations. Each
            query will be checked independently.
          </p>
        </div>

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

                <!-- Discord Webhook Input Menu -->
                <div
                  v-if="selectedNotificationType === 'DISCORD'"
                  class="flex flex-col gap-3"
                >
                  <UInputMenu
                    v-model="selectedDiscordWebhooks"
                    :items="discordWebhookItems"
                    multiple
                    create-item
                    size="md"
                    placeholder="Select Discord webhooks or enter custom webhook URL"
                    icon="ic:baseline-discord"
                    class="w-full"
                    @create="onCreateDiscordWebhook"
                    @update:model-value="onDiscordWebhookSelect"
                  >
                    <template #item-label="{ item }">
                      <div class="flex flex-col">
                        <span>{{ item.label }}</span>
                        <span class="text-xs text-neutral-400 truncate">{{
                          item.value
                        }}</span>
                      </div>
                    </template>
                    <template #tags-item-text="{ item }">
                      <span class="truncate">{{ item.label }}</span>
                    </template>
                  </UInputMenu>

                  <p class="text-xs text-neutral-500">
                    Select from configured webhooks or paste a Discord webhook
                    URL and press Enter to add.
                  </p>
                </div>

                <!-- Email Input Field (when EMAIL is selected) -->
                <div
                  v-else-if="selectedNotificationType === 'EMAIL'"
                  class="flex gap-2 items-center"
                >
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
