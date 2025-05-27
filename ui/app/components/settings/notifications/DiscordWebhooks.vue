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
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Manage predefined Discord webhook URLs that can be used in watchers.
        Each webhook can have a custom name for easy identification.
      </p>
      <UButton
        icon="heroicons:plus"
        size="sm"
        :disabled="isAddingWebhook"
        @click="addWebhook"
      >
        Add Webhook
      </UButton>
    </div>

    <!-- Add new webhook form -->
    <div
      v-if="isAddingWebhook"
      class="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800"
    >
      <h4 class="font-medium mb-3">Add New Webhook</h4>
      <div class="space-y-3">
        <div>
          <label for="webhook-name" class="block text-sm font-medium mb-1"
            >Name</label
          >
          <UInput
            id="webhook-name"
            v-model="newWebhook.name"
            placeholder="e.g., Main Channel, Alerts, etc."
            class="w-full"
          />
        </div>
        <div>
          <label for="webhook-url" class="block text-sm font-medium mb-1"
            >Webhook URL</label
          >
          <UInput
            id="webhook-url"
            v-model="newWebhook.url"
            placeholder="https://discord.com/api/webhooks/..."
            class="w-full"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            @click="cancelNewWebhook"
          >
            Cancel
          </UButton>
          <UButton
            size="sm"
            :disabled="!newWebhook.name.trim() || !isValidUrl(newWebhook.url)"
            @click="saveNewWebhook"
          >
            Add Webhook
          </UButton>
        </div>
      </div>
    </div>

    <!-- Webhooks list -->
    <div v-if="webhooks.length > 0" class="space-y-3">
      <h4 class="font-medium">Configured Webhooks</h4>
      <div class="space-y-2">
        <div
          v-for="(webhook, index) in webhooks"
          :key="webhook.id"
          class="flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg"
        >
          <div class="flex-1 space-y-2">
            <div v-if="editingIndex === index" class="space-y-2">
              <UInput
                v-model="webhook.name"
                placeholder="Webhook name"
                class="w-full"
              />
              <UInput
                v-model="webhook.url"
                placeholder="Webhook URL"
                class="w-full"
              />
            </div>
            <div v-else>
              <div class="font-medium">{{ webhook.name }}</div>
              <div class="text-sm text-neutral-500 truncate text-wrap">
                {{ webhook.url }}
              </div>
            </div>
          </div>

          <div class="flex gap-1">
            <div v-if="editingIndex === index" class="flex gap-1">
              <UButton
                size="sm"
                icon="heroicons:check"
                color="success"
                :disabled="!webhook.name.trim() || !isValidUrl(webhook.url)"
                @click="saveEditWebhook(index)"
              />
              <UButton
                size="sm"
                icon="heroicons:x-mark"
                color="neutral"
                variant="outline"
                @click="cancelEditWebhook"
              />
            </div>
            <div v-else class="flex gap-1">
              <UButton
                size="sm"
                icon="heroicons:pencil"
                color="neutral"
                variant="outline"
                @click="editWebhook(index)"
              />
              <UButton
                size="sm"
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
    <div v-else-if="!isAddingWebhook" class="text-center py-8 text-neutral-500">
      <UIcon name="material-symbols:webhook" class="text-4xl mb-2 opacity-50" />
      <p>No Discord webhooks configured</p>
      <p class="text-sm">Add your first webhook to get started</p>
    </div>
  </div>
</template>
