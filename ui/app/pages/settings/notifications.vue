<script lang="ts" setup>
import * as z from 'zod';

definePageMeta({
  layout: 'default',
});

const settingsStore = useSettingsStore();
const toast = useToast();

const isLoading = ref(true);
const isSaving = ref(false);
const resetConfirmationOpen = ref(false);

// Form schemas for different sections
const discordSchema = z.object({
  enabled: z.boolean(),
  webhookUrl: z
    .string()
    .url('Please enter a valid URL')
    .or(z.string().length(0)),
  username: z.string(),
  avatarUrl: z
    .string()
    .url('Please enter a valid URL')
    .or(z.string().length(0)),
  maxRetries: z.number().int().min(1, 'Min 1').max(10, 'Max 10'),
  retryDelay: z.number().int().min(500, 'Min 500ms').max(10000, 'Max 10000ms'),
});

const emailSchema = z.object({
  enabled: z.boolean(),
  from: z.string().email('Invalid email').or(z.string().length(0)),
  to: z.string().email('Invalid email').or(z.string().length(0)),
  subject: z.string(),
  smtpHost: z.string(),
  smtpPort: z.number().int().min(1, 'Min 1').max(65535, 'Max 65535'),
  smtpUser: z.string(),
  smtpPass: z.string(),
  useTLS: z.boolean(),
});

const batchingSchema = z.object({
  enableBatching: z.boolean(),
  batchSize: z.number().int().min(1, 'Min 1').max(100, 'Max 100'),
});

// Form states
const discordState = reactive({
  enabled: false,
  webhookUrl: '',
  username: 'Blocket Bot',
  avatarUrl: '',
  maxRetries: 3,
  retryDelay: 1000,
});

const emailState = reactive({
  enabled: false,
  from: '',
  to: '',
  subject: 'New Blocket listings found',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  useTLS: true,
});

const batchingState = reactive({
  enableBatching: true,
  batchSize: 10,
});

// Load settings from the store
onMounted(async () => {
  isLoading.value = true;
  try {
    await settingsStore.fetchSettings();

    // Map settings to state objects
    settingsStore.settings.forEach((setting) => {
      if (setting.key === 'notification.discord.enabled') {
        discordState.enabled = setting.value === 'true';
      } else if (setting.key === 'notification.discord.webhook_url') {
        discordState.webhookUrl = setting.value;
      } else if (setting.key === 'notification.discord.username') {
        discordState.username = setting.value;
      } else if (setting.key === 'notification.discord.avatar_url') {
        discordState.avatarUrl = setting.value;
      } else if (setting.key === 'notification.discord.max_retries') {
        discordState.maxRetries = parseInt(setting.value) || 3;
      } else if (setting.key === 'notification.discord.retry_delay') {
        discordState.retryDelay = parseInt(setting.value) || 1000;
      } else if (setting.key === 'notification.email.enabled') {
        emailState.enabled = setting.value === 'true';
      } else if (setting.key === 'notification.email.from') {
        emailState.from = setting.value;
      } else if (setting.key === 'notification.email.to') {
        emailState.to = setting.value;
      } else if (setting.key === 'notification.email.subject') {
        emailState.subject = setting.value;
      } else if (setting.key === 'notification.email.smtp_host') {
        emailState.smtpHost = setting.value;
      } else if (setting.key === 'notification.email.smtp_port') {
        emailState.smtpPort = parseInt(setting.value) || 587;
      } else if (setting.key === 'notification.email.smtp_user') {
        emailState.smtpUser = setting.value;
      } else if (setting.key === 'notification.email.smtp_pass') {
        emailState.smtpPass = setting.value;
      } else if (setting.key === 'notification.email.use_tls') {
        emailState.useTLS = setting.value === 'true';
      } else if (setting.key === 'notification.general.enable_batching') {
        batchingState.enableBatching = setting.value === 'true';
      } else if (setting.key === 'notification.general.batch_size') {
        batchingState.batchSize = parseInt(setting.value) || 10;
      }
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to load settings',
      color: 'error',
    });

    console.error('Failed to load settings:', error);
  } finally {
    isLoading.value = false;
  }
});

// Save Discord settings
async function saveDiscordSettings() {
  isSaving.value = true;
  try {
    await settingsStore.updateSetting(
      'notification.discord.enabled',
      discordState.enabled.toString()
    );
    await settingsStore.updateSetting(
      'notification.discord.webhook_url',
      discordState.webhookUrl
    );
    await settingsStore.updateSetting(
      'notification.discord.username',
      discordState.username
    );
    await settingsStore.updateSetting(
      'notification.discord.avatar_url',
      discordState.avatarUrl
    );
    await settingsStore.updateSetting(
      'notification.discord.max_retries',
      discordState.maxRetries.toString()
    );
    await settingsStore.updateSetting(
      'notification.discord.retry_delay',
      discordState.retryDelay.toString()
    );

    toast.add({
      title: 'Success',
      description: 'Discord notification settings saved',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save Discord settings',
      color: 'error',
    });
    console.error('Failed to save Discord settings:', error);
  } finally {
    isSaving.value = false;
  }
}

// Save Email settings
async function saveEmailSettings() {
  isSaving.value = true;
  try {
    await settingsStore.updateSetting(
      'notification.email.enabled',
      emailState.enabled.toString()
    );
    await settingsStore.updateSetting(
      'notification.email.from',
      emailState.from
    );
    await settingsStore.updateSetting('notification.email.to', emailState.to);
    await settingsStore.updateSetting(
      'notification.email.subject',
      emailState.subject
    );
    await settingsStore.updateSetting(
      'notification.email.smtp_host',
      emailState.smtpHost
    );
    await settingsStore.updateSetting(
      'notification.email.smtp_port',
      emailState.smtpPort.toString()
    );
    await settingsStore.updateSetting(
      'notification.email.smtp_user',
      emailState.smtpUser
    );
    await settingsStore.updateSetting(
      'notification.email.smtp_pass',
      emailState.smtpPass
    );
    await settingsStore.updateSetting(
      'notification.email.use_tls',
      emailState.useTLS.toString()
    );

    toast.add({
      title: 'Success',
      description: 'Email notification settings saved',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save Email settings',
      color: 'error',
    });
    console.error('Failed to save Email settings:', error);
  } finally {
    isSaving.value = false;
  }
}

// Save General notification settings
async function saveBatchingSettings() {
  isSaving.value = true;
  try {
    await settingsStore.updateSetting(
      'notification.general.enable_batching',
      batchingState.enableBatching.toString()
    );
    await settingsStore.updateSetting(
      'notification.general.batch_size',
      batchingState.batchSize.toString()
    );

    toast.add({
      title: 'Success',
      description: 'Notification batching settings saved',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save batching settings',
      color: 'error',
    });
    console.error('Failed to save batching settings:', error);
  } finally {
    isSaving.value = false;
  }
}

// Reset all settings to defaults
async function resetSettings() {
  try {
    await settingsStore.resetToDefaults();
    resetConfirmationOpen.value = false;

    toast.add({
      title: 'Success',
      description: 'All settings have been reset to default values',
      color: 'success',
    });

    // Reload the page to refresh settings
    window.location.reload();
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to reset settings',
      color: 'error',
    });
    console.error('Failed to reset settings:', error);
  }
}

async function testDiscordNotification() {
  isSaving.value = true;
  try {
    // Basic test notification message
    const testMessage = {
      subject: 'Test Notification',
      body: 'This is a test notification from Blocket Bot',
      price: { value: 1000, suffix: ' kr' },
      share_url: 'https://www.blocket.se',
      images: [
        { url: discordState.avatarUrl || 'https://www.blocket.se/favicon.ico' },
      ],
    };

    await useFetch('/notifications/test/discord', {
      method: 'POST',
      baseURL: useRuntimeConfig().public.apiBaseUrl,
      body: [testMessage],
    });

    toast.add({
      title: 'Success',
      description: 'Test notification sent. Check your Discord channel.',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to send test notification',
      color: 'error',
    });
    console.error('Failed to send test notification:', error);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="max-w-4xl mx-auto">
      <header class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">Notification Settings</h1>
          <p class="text-neutral-500 mt-2">
            Manage your notification preferences
          </p>
        </div>
        <UButton
          color="error"
          variant="outline"
          @click="resetConfirmationOpen = true"
        >
          Reset All Settings
        </UButton>
      </header>

      <UModal v-model="resetConfirmationOpen">
        <template #header>
          <div class="text-red-500 font-bold">Reset All Settings</div>
        </template>

        <template #body>
          <p>
            Are you sure you want to reset all settings to their default values?
            This action cannot be undone.
          </p>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" @click="resetConfirmationOpen = false"
              >Cancel</UButton
            >
            <UButton color="error" @click="resetSettings"
              >Reset All Settings</UButton
            >
          </div>
        </template>
      </UModal>

      <div v-if="isLoading" class="flex justify-center my-10">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
      </div>

      <div v-else class="space-y-6">
        <!-- Discord Notification Settings -->
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
            <div class="flex items-center space-x-2 mb-4">
              <UCheckbox
                id="discord-enabled"
                v-model="discordState.enabled"
                name="enabled"
              />
              <label for="discord-enabled" class="font-medium"
                >Enable Discord Notifications</label
              >
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="md:col-span-2">
                <div class="mb-1">
                  <label
                    for="discord-webhook-url"
                    class="block font-medium text-sm"
                    >Webhook URL</label
                  >
                </div>
                <UInput
                  id="discord-webhook-url"
                  v-model="discordState.webhookUrl"
                  placeholder="https://discord.com/api/webhooks/..."
                  :disabled="!discordState.enabled"
                />
                <p class="text-xs text-neutral-500 mt-1">
                  Discord webhook URL for sending notifications
                </p>
              </div>

              <div>
                <div class="mb-1">
                  <label
                    for="discord-username"
                    class="block font-medium text-sm"
                    >Bot Username</label
                  >
                </div>
                <UInput
                  id="discord-username"
                  v-model="discordState.username"
                  placeholder="Blocket Bot"
                  :disabled="!discordState.enabled"
                />
                <p class="text-xs text-neutral-500 mt-1">
                  Name that will appear for the bot in Discord
                </p>
              </div>

              <div>
                <div class="mb-1">
                  <label
                    for="discord-avatar-url"
                    class="block font-medium text-sm"
                    >Avatar URL</label
                  >
                </div>
                <UInput
                  id="discord-avatar-url"
                  v-model="discordState.avatarUrl"
                  placeholder="https://example.com/avatar.png"
                  :disabled="!discordState.enabled"
                />
                <p class="text-xs text-neutral-500 mt-1">
                  URL to the bot's avatar image (optional)
                </p>
              </div>
            </div>

            <div class="flex gap-4 justify-end">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="!discordState.enabled || !discordState.webhookUrl"
                @click="testDiscordNotification"
              >
                Test Notification
              </UButton>
              <UButton type="submit" :loading="isSaving">
                Save Discord Settings
              </UButton>
            </div>
          </UForm>
        </UCard>

        <!-- Email Notification Settings -->
        <UCard>
          <template #header>
            <div class="flex items-center">
              <UIcon name="material-symbols:mail" class="mr-2 text-xl" />
              <h2 class="text-lg font-semibold">Email Notifications</h2>
              <UBadge class="ml-2" color="neutral">Coming Soon</UBadge>
            </div>
          </template>
          <UForm
            :schema="emailSchema"
            :state="emailState"
            class="space-y-4"
            @submit="saveEmailSettings"
          >
            <div class="flex items-center space-x-2 mb-4">
              <UCheckbox
                id="email-enabled"
                v-model="emailState.enabled"
                name="enabled"
                disabled
              />
              <label for="email-enabled" class="font-medium"
                >Enable Email Notifications</label
              >
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div class="mb-1">
                  <label for="email-from" class="block font-medium text-sm"
                    >From Email</label
                  >
                </div>
                <UInput
                  id="email-from"
                  v-model="emailState.from"
                  placeholder="sender@example.com"
                  disabled
                />
                <p class="text-xs text-neutral-500 mt-1">
                  Sender email address
                </p>
              </div>

              <div>
                <div class="mb-1">
                  <label for="email-to" class="block font-medium text-sm"
                    >To Email</label
                  >
                </div>
                <UInput
                  id="email-to"
                  v-model="emailState.to"
                  placeholder="recipient@example.com"
                  disabled
                />
                <p class="text-xs text-neutral-500 mt-1">
                  Recipient email address
                </p>
              </div>

              <div class="md:col-span-2">
                <div class="mb-1">
                  <label for="email-subject" class="block font-medium text-sm"
                    >Email Subject</label
                  >
                </div>
                <UInput
                  id="email-subject"
                  v-model="emailState.subject"
                  placeholder="New Blocket Listings"
                  disabled
                />
                <p class="text-xs text-neutral-500 mt-1">
                  Subject line for notification emails
                </p>
              </div>

              <div>
                <div class="mb-1">
                  <label for="smtp-host" class="block font-medium text-sm"
                    >SMTP Host</label
                  >
                </div>
                <UInput
                  id="smtp-host"
                  v-model="emailState.smtpHost"
                  placeholder="smtp.example.com"
                  disabled
                />
                <p class="text-xs text-neutral-500 mt-1">SMTP server address</p>
              </div>

              <div>
                <div class="mb-1">
                  <label for="smtp-port" class="block font-medium text-sm"
                    >SMTP Port</label
                  >
                </div>
                <UInput
                  id="smtp-port"
                  v-model.number="emailState.smtpPort"
                  type="number"
                  :min="1"
                  :max="65535"
                  disabled
                />
                <p class="text-xs text-neutral-500 mt-1">SMTP server port</p>
              </div>

              <div>
                <div class="mb-1">
                  <label for="smtp-user" class="block font-medium text-sm"
                    >SMTP Username</label
                  >
                </div>
                <UInput
                  id="smtp-user"
                  v-model="emailState.smtpUser"
                  placeholder="username"
                  disabled
                />
                <p class="text-xs text-neutral-500 mt-1">
                  SMTP authentication username
                </p>
              </div>

              <div>
                <div class="mb-1">
                  <label for="smtp-pass" class="block font-medium text-sm"
                    >SMTP Password</label
                  >
                </div>
                <UInput
                  id="smtp-pass"
                  v-model="emailState.smtpPass"
                  type="password"
                  placeholder="••••••••"
                  disabled
                />
                <p class="text-xs text-neutral-500 mt-1">
                  SMTP authentication password
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-2 mb-4">
              <UCheckbox
                id="use-tls"
                v-model="emailState.useTLS"
                name="useTLS"
                disabled
              />
              <label for="use-tls" class="font-medium">Use TLS</label>
            </div>

            <div class="flex justify-end">
              <UButton type="submit" :loading="isSaving" disabled>
                Save Email Settings
              </UButton>
            </div>
          </UForm>
        </UCard>

        <!-- General Notification Settings -->
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
              <UButton type="submit" :loading="isSaving">
                Save Batching Settings
              </UButton>
            </div>
          </UForm>
        </UCard>
      </div>
    </div>
  </div>
</template>
