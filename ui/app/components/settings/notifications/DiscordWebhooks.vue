<script lang="ts" setup>
import * as z from 'zod';

type DiscordWebhook = {
  id: string;
  name: string;
  url: string;
};

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
  webhooks?: DiscordWebhook[];
}>();

const emit = defineEmits<{
  save: [webhooks: DiscordWebhook[]];
}>();

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Please enter a valid Discord webhook URL'),
});

const webhooks = ref<DiscordWebhook[]>(props.webhooks || []);
const newWebhook = ref({
  name: '',
  url: '',
});
const isAddingWebhook = ref(false);
const editingIndex = ref<number | null>(null);

watch(
  () => props.webhooks,
  (newWebhooks) => {
    if (newWebhooks) {
      webhooks.value = [...newWebhooks];
    }
  },
  { immediate: true }
);

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function addWebhook() {
  isAddingWebhook.value = true;
  newWebhook.value = { name: '', url: '' };
}

function saveNewWebhook() {
  try {
    webhookSchema.parse(newWebhook.value);

    webhooks.value.push({
      id: generateId(),
      name: newWebhook.value.name.trim(),
      url: newWebhook.value.url.trim(),
    });

    isAddingWebhook.value = false;
    newWebhook.value = { name: '', url: '' };
    saveWebhooks();
  } catch (error) {
    console.error('Validation error:', error);
  }
}

function cancelNewWebhook() {
  isAddingWebhook.value = false;
  newWebhook.value = { name: '', url: '' };
}

function editWebhook(index: number) {
  editingIndex.value = index;
}

function saveEditWebhook(index: number) {
  try {
    const webhook = webhooks.value[index];
    if (!webhook) return;

    webhookSchema.parse({ name: webhook.name, url: webhook.url });

    editingIndex.value = null;
    saveWebhooks();
  } catch (error) {
    console.error('Validation error:', error);
  }
}

function cancelEditWebhook() {
  // Restore original values if needed
  editingIndex.value = null;
}

function removeWebhook(index: number) {
  webhooks.value.splice(index, 1);
  saveWebhooks();
}

function saveWebhooks() {
  emit('save', webhooks.value);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.includes('discord.com/api/webhooks/');
  } catch {
    return false;
  }
}

defineExpose({
  webhooks,
});
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <p class="text-neutral-600 dark:text-neutral-400 max-w-2xl">
        Manage predefined Discord webhook URLs that can be used in watchers.
        Each webhook can have a custom name for easy identification.
      </p>
      <UButton
        icon="heroicons:plus"
        size="md"
        :disabled="isAddingWebhook"
        @click="addWebhook"
      >
        Add Webhook
      </UButton>
    </div>

    <!-- Add new webhook form -->
    <UCard v-if="isAddingWebhook" class="border-dashed border-2">
      <template #header>
        <div class="flex items-center">
          <UIcon name="heroicons:plus" class="mr-3 text-lg" />
          <h4 class="font-semibold text-lg">Add New Webhook</h4>
        </div>
      </template>

      <div class="space-y-6 p-2">
        <UFormGroup
          class="flex flex-col"
          label="Webhook Name"
          description="A friendly name to identify this webhook"
          name="name"
        >
          <label
            for="webhookName"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            Webhook Name
          </label>
          <UInput
            v-model="newWebhook.name"
            placeholder="e.g., Main Channel, Alerts, etc."
            icon="heroicons:tag"
            size="md"
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            A friendly name to identify this webhook
          </p>
        </UFormGroup>

        <UFormGroup
          class="flex flex-col"
          label="Webhook URL"
          description="Discord webhook URL from your server settings"
          name="url"
        >
          <label
            for="webhookUrl"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            Webhook URL
          </label>
          <UInput
            v-model="newWebhook.url"
            placeholder="https://discord.com/api/webhooks/..."
            icon="heroicons:link"
            size="md"
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Discord webhook URL from your server settings
          </p>
        </UFormGroup>

        <div
          class="flex gap-3 justify-end pt-6 border-t border-neutral-200 dark:border-neutral-700"
        >
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            @click="cancelNewWebhook"
          >
            Cancel
          </UButton>
          <UButton
            size="md"
            icon="heroicons:check"
            :disabled="!newWebhook.name.trim() || !isValidUrl(newWebhook.url)"
            @click="saveNewWebhook"
          >
            Add Webhook
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Webhooks list -->
    <div v-if="webhooks.length > 0" class="space-y-6">
      <h4 class="font-semibold text-lg">Configured Webhooks</h4>
      <div class="space-y-4">
        <div
          v-for="(webhook, index) in webhooks"
          :key="webhook.id"
          class="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
        >
          <div class="flex-1 space-y-3">
            <div v-if="editingIndex === index" class="space-y-4">
              <UInput
                v-model="webhook.name"
                placeholder="Webhook name"
                size="md"
                class="w-full"
              />
              <UInput
                v-model="webhook.url"
                placeholder="Webhook URL"
                size="md"
                class="w-full"
              />
            </div>
            <div v-else class="space-y-2">
              <div class="font-semibold text-lg">{{ webhook.name }}</div>
              <div class="text-sm text-neutral-500 break-all">
                {{ webhook.url }}
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <div v-if="editingIndex === index" class="flex gap-2">
              <UButton
                size="md"
                icon="heroicons:check"
                color="success"
                variant="soft"
                :disabled="!webhook.name.trim() || !isValidUrl(webhook.url)"
                @click="saveEditWebhook(index)"
              />
              <UButton
                size="md"
                icon="heroicons:x-mark"
                color="neutral"
                variant="outline"
                @click="cancelEditWebhook"
              />
            </div>
            <div v-else class="flex gap-2">
              <UButton
                size="md"
                icon="heroicons:pencil"
                color="neutral"
                variant="outline"
                @click="editWebhook(index)"
              />
              <UButton
                size="md"
                icon="heroicons:trash"
                color="error"
                variant="outline"
                @click="removeWebhook(index)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!isAddingWebhook"
      class="text-center py-12 text-neutral-500"
    >
      <UIcon name="material-symbols:webhook" class="text-6xl mb-4 opacity-50" />
      <p class="text-lg font-medium mb-2">No Discord webhooks configured</p>
      <p class="text-sm">Add your first webhook to get started</p>
    </div>
  </div>
</template>
