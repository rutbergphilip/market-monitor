<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
  settings?: {
    username?: string;
    avatarUrl?: string;
    maxRetries?: string | number;
    retryDelay?: string | number;
  };
}>();

const emit = defineEmits<{
  save: [];
  test: [];
}>();

const discordSchema = z.object({
  username: z.string(),
  avatarUrl: z
    .string()
    .url('Please enter a valid URL')
    .or(z.string().length(0)),
  maxRetries: z.number().int().min(1, 'Min 1').max(10, 'Max 10'),
  retryDelay: z.number().int().min(500, 'Min 500ms').max(10000, 'Max 10000ms'),
});

const discordState = reactive({
  username: props.settings?.username || 'Market Monitor',
  avatarUrl: props.settings?.avatarUrl || '',
  maxRetries:
    props.settings?.maxRetries !== undefined
      ? Number(props.settings.maxRetries)
      : 3,
  retryDelay:
    props.settings?.retryDelay !== undefined
      ? Number(props.settings.retryDelay)
      : 1000,
});

defineExpose({
  discordState,
});

function saveDiscordSettings() {
  emit('save');
}
</script>

<template>
  <UForm
    :schema="discordSchema"
    :state="discordState"
    class="space-y-8"
    @submit="saveDiscordSettings"
  >
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Bot Identity Settings -->
      <div class="space-y-6">
        <h4
          class="font-medium text-base text-neutral-700 dark:text-neutral-300 flex items-center pb-2"
        >
          <UIcon name="heroicons:identification" class="mr-2" />
          Bot Identity
        </h4>

        <UFormGroup
          class="flex flex-col"
          label="Bot Username"
          description="Name that will appear for the bot in Discord"
          name="username"
        >
          <label
            for="username"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            Bot Username
          </label>
          <UInput
            v-model="discordState.username"
            placeholder="Market Monitor"
            icon="heroicons:user"
            size="md"
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Name that will appear for the bot in Discord
          </p>
        </UFormGroup>

        <UFormGroup
          class="flex flex-col"
          label="Avatar URL"
          description="URL to the bot's avatar image (optional)"
          name="avatarUrl"
        >
          <label
            for="avatarUrl"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            Avatar URL
          </label>
          <UInput
            v-model="discordState.avatarUrl"
            placeholder="https://example.com/avatar.png"
            icon="heroicons:photo"
            size="md"
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            URL to the bot's avatar image (optional)
          </p>
        </UFormGroup>
      </div>

      <!-- Reliability Settings -->
      <div class="space-y-6">
        <h4
          class="font-medium text-base text-neutral-700 dark:text-neutral-300 flex items-center pb-2"
        >
          <UIcon name="heroicons:arrow-path" class="mr-2" />
          Reliability
        </h4>

        <UFormGroup
          class="flex flex-col"
          label="Max Retries"
          description="Maximum number of retries (1-10)"
          name="maxRetries"
        >
          <label
            for="maxRetries"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            Max Retries
          </label>
          <UInput
            v-model="discordState.maxRetries"
            type="number"
            placeholder="3"
            icon="heroicons:arrow-path"
            size="md"
            class="w-40"
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Maximum number of retries (1-10)
          </p>
        </UFormGroup>

        <UFormGroup
          class="flex flex-col"
          label="Retry Delay (ms)"
          description="Delay between retries in milliseconds (500-10000)"
          name="retryDelay"
        >
          <label
            for="retryDelay"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            Retry Delay (ms)
          </label>
          <UInput
            v-model="discordState.retryDelay"
            type="number"
            placeholder="1000"
            icon="heroicons:clock"
            size="md"
            class="w-40"
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Delay between retries in milliseconds (500-10000)
          </p>
        </UFormGroup>
      </div>
    </div>

    <UDivider class="my-8" />

    <div class="flex gap-4 justify-end py-4">
      <UButton
        variant="outline"
        color="neutral"
        icon="heroicons:paper-airplane"
        size="md"
        :loading="props.isSaving"
        @click="$emit('test')"
      >
        Test Notification
      </UButton>
      <UButton
        type="submit"
        icon="heroicons:check"
        size="md"
        :loading="props.isSaving"
      >
        Save Settings
      </UButton>
    </div>
  </UForm>
</template>
