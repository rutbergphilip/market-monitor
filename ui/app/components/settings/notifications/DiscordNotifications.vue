<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
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
});

const discordState = reactive({
  username: 'Blocket Bot',
  avatarUrl: '',
});

defineExpose({
  discordState,
});

function saveDiscordSettings() {
  emit('save');
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center">
        <UIcon name="ic:baseline-discord" class="mr-2 text-xl" />
        <h2 class="text-lg font-semibold">Discord Notifications</h2>
      </div>
    </template>
    <UForm
      :schema="discordSchema"
      :state="discordState"
      class="space-y-4"
      @submit="saveDiscordSettings"
    >
      <div class="flex flex-col gap-4 justify-between mb-4">
        <div class="w-2/3">
          <div class="mb-1">
            <label for="discord-username" class="block font-medium text-sm"
              >Bot Username</label
            >
          </div>
          <UInput
            id="discord-username"
            v-model="discordState.username"
            class="w-2/3"
            placeholder="Blocket Bot"
          />
          <p class="text-xs text-neutral-500 mt-1">
            Name that will appear for the bot in Discord
          </p>
        </div>

        <div class="w-2/3">
          <div class="mb-1">
            <label for="discord-avatar-url" class="block font-medium text-sm"
              >Avatar URL</label
            >
          </div>
          <UInput
            id="discord-avatar-url"
            v-model="discordState.avatarUrl"
            class="w-2/3"
            placeholder="https://example.com/avatar.png"
          />
          <p class="text-xs text-neutral-500 mt-1">
            URL to the bot's avatar image (optional)
          </p>
        </div>
      </div>

      <div class="flex gap-4 justify-end">
        <UButton type="submit" :loading="props.isSaving">
          Save Discord Settings
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
