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
            <UFormGroup class="flex items-center space-x-2">
              <UCheckbox v-model="discordState.enabled" name="enabled" />
              <span class="font-medium">Enable Discord Notifications</span>
            </UFormGroup>

            <UFormGroup
              label="Webhook URL"
              name="webhookUrl"
              help="Discord webhook URL for sending notifications"
            >
              <UInput
                v-model="discordState.webhookUrl"
                placeholder="https://discord.com/api/webhooks/..."
                :disabled="!discordState.enabled"
              />
            </UFormGroup>

            <UFormGroup
              label="Bot Username"
              name="username"
              help="Name that will appear for the bot in Discord"
            >
              <UInput
                v-model="discordState.username"
                placeholder="Blocket Bot"
                :disabled="!discordState.enabled"
              />
            </UFormGroup>

            <UFormGroup
              label="Avatar URL"
              name="avatarUrl"
              help="URL to the bot's avatar image (optional)"
            >
              <UInput
                v-model="discordState.avatarUrl"
                placeholder="https://example.com/avatar.png"
                :disabled="!discordState.enabled"
              />
            </UFormGroup>

            <div class="flex gap-4">
              <UFormGroup
                label="Max Retries"
                name="maxRetries"
                help="Number of retries on failure"
                class="flex-1"
              >
                <UInput
                  v-model.number="discordState.maxRetries"
                  type="number"
                  :min="1"
                  :max="10"
                  :disabled="!discordState.enabled"
                />
              </UFormGroup>

              <UFormGroup
                label="Retry Delay (ms)"
                name="retryDelay"
                help="Delay between retries in milliseconds"
                class="flex-1"
              >
                <UInput
                  v-model.number="discordState.retryDelay"
                  type="number"
                  :min="500"
                  :max="10000"
                  step="100"
                  :disabled="!discordState.enabled"
                />
              </UFormGroup>
            </div>

            <div class="flex gap-2 mt-4 justify-end">
              <UButton
                color="neutral"
                variant="ghost"
                @click="testDiscordNotification"
                :disabled="!discordState.enabled || !discordState.webhookUrl"
              >
                Test Notification
              </UButton>
              <UButton type="submit" :loading="isSaving"
                >Save Discord Settings</UButton
              >
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
            <UFormGroup class="flex items-center space-x-2">
              <UCheckbox v-model="emailState.enabled" name="enabled" disabled />
              <span class="font-medium">Enable Email Notifications</span>
            </UFormGroup>

            <div class="flex gap-4">
              <UFormGroup
                label="From Email"
                name="from"
                help="Sender email address"
                class="flex-1"
              >
                <UInput
                  v-model="emailState.from"
                  placeholder="sender@example.com"
                  disabled
                />
              </UFormGroup>

              <UFormGroup
                label="To Email"
                name="to"
                help="Recipient email address"
                class="flex-1"
              >
                <UInput
                  v-model="emailState.to"
                  placeholder="recipient@example.com"
                  disabled
                />
              </UFormGroup>
            </div>

            <UFormGroup
              label="Email Subject"
              name="subject"
              help="Subject line for notification emails"
            >
              <UInput
                v-model="emailState.subject"
                placeholder="New Blocket Listings"
                disabled
              />
            </UFormGroup>

            <div class="flex gap-4">
              <UFormGroup
                label="SMTP Host"
                name="smtpHost"
                help="SMTP server address"
                class="flex-1"
              >
                <UInput
                  v-model="emailState.smtpHost"
                  placeholder="smtp.example.com"
                  disabled
                />
              </UFormGroup>

              <UFormGroup
                label="SMTP Port"
                name="smtpPort"
                help="SMTP server port"
                class="flex-1"
              >
                <UInput
                  v-model.number="emailState.smtpPort"
                  type="number"
                  :min="1"
                  :max="65535"
                  disabled
                />
              </UFormGroup>
            </div>

            <div class="flex gap-4">
              <UFormGroup
                label="SMTP Username"
                name="smtpUser"
                help="SMTP authentication username"
                class="flex-1"
              >
                <UInput
                  v-model="emailState.smtpUser"
                  placeholder="username"
                  disabled
                />
              </UFormGroup>

              <UFormGroup
                label="SMTP Password"
                name="smtpPass"
                help="SMTP authentication password"
                class="flex-1"
              >
                <UInput
                  v-model="emailState.smtpPass"
                  type="password"
                  placeholder="••••••••"
                  disabled
                />
              </UFormGroup>
            </div>

            <UFormGroup class="flex items-center space-x-2">
              <UCheckbox v-model="emailState.useTLS" name="useTLS" disabled />
              <span class="font-medium">Use TLS</span>
            </UFormGroup>

            <div class="flex justify-end mt-4">
              <UButton type="submit" :loading="isSaving" disabled
                >Save Email Settings</UButton
              >
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
            <UFormGroup class="flex items-center space-x-2">
              <UCheckbox
                v-model="batchingState.enableBatching"
                name="enableBatching"
              />
              <span class="font-medium">Enable Notification Batching</span>
            </UFormGroup>

            <UFormGroup
              label="Batch Size"
              name="batchSize"
              help="Number of notifications to send in one batch"
            >
              <UInput
                v-model.number="batchingState.batchSize"
                type="number"
                :min="1"
                :max="100"
                :disabled="!batchingState.enableBatching"
              />
            </UFormGroup>

            <div class="flex justify-end mt-4">
              <UButton type="submit" :loading="isSaving"
                >Save Batching Settings</UButton
              >
            </div>
          </UForm>
        </UCard>
      </div>
    </div>
  </div>
</template>
