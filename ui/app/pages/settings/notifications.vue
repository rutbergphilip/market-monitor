<script lang="ts" setup>
import DiscordNotifications from '~/components/settings/notifications/DiscordNotifications.vue';
import EmailNotifications from '~/components/settings/notifications/EmailNotifications.vue';
import BatchingSettings from '~/components/settings/notifications/BatchingSettings.vue';

definePageMeta({
  layout: 'default',
});

const settingsStore = useSettingsStore();
const toast = useToast();

type DiscordRef = {
  discordState: {
    username: string;
    avatarUrl: string;
    maxRetries: number;
    retryDelay: number;
  };
};

type EmailRef = {
  emailState: {
    enabled: boolean;
    from: string;
    to: string;
    subject: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    useTLS: boolean;
  };
};

type BatchingRef = {
  batchingState: {
    enableBatching: boolean;
    batchSize: number;
  };
};

const discordRef = ref<DiscordRef | null>(null);
const emailRef = ref<EmailRef | null>(null);
const batchingRef = ref<BatchingRef | null>(null);

const isLoading = ref(true);
const isSaving = ref(false);
const resetConfirmationOpen = ref(false);

const discordSettings = computed(() => {
  if (!settingsStore.settings.length) return undefined;

  return {
    username:
      settingsStore.getSettingValue('notification.discord.username') ||
      'Blocket Bot',
    avatarUrl:
      settingsStore.getSettingValue('notification.discord.avatar_url') || '',
    maxRetries: parseInt(
      settingsStore.getSettingValue('notification.discord.max_retries') || '3'
    ),
    retryDelay: parseInt(
      settingsStore.getSettingValue('notification.discord.retry_delay') ||
        '1000'
    ),
  };
});

const emailSettings = computed(() => {
  if (!settingsStore.settings.length) return undefined;

  return {
    enabled:
      settingsStore.getSettingValue('notification.email.enabled') === 'true',
    from: settingsStore.getSettingValue('notification.email.from') || '',
    to: settingsStore.getSettingValue('notification.email.to') || '',
    subject:
      settingsStore.getSettingValue('notification.email.subject') ||
      'New Blocket Listings',
    smtpHost:
      settingsStore.getSettingValue('notification.email.smtp_host') || '',
    smtpPort: parseInt(
      settingsStore.getSettingValue('notification.email.smtp_port') || '587'
    ),
    smtpUser:
      settingsStore.getSettingValue('notification.email.smtp_user') || '',
    smtpPass:
      settingsStore.getSettingValue('notification.email.smtp_pass') || '',
    useTLS:
      settingsStore.getSettingValue('notification.email.use_tls') === 'true',
  };
});

const batchingSettings = computed(() => {
  if (!settingsStore.settings.length) return undefined;

  return {
    enableBatching:
      settingsStore.getSettingValue('notification.general.enable_batching') ===
      'true',
    batchSize: parseInt(
      settingsStore.getSettingValue('notification.general.batch_size') || '10'
    ),
  };
});

const settingsMap = {
  'notification.discord.username': (value: string) => {
    if (discordRef.value) discordRef.value.discordState.username = value;
  },
  'notification.discord.avatar_url': (value: string) => {
    if (discordRef.value) discordRef.value.discordState.avatarUrl = value;
  },
  'notification.discord.max_retries': (value: string) => {
    if (discordRef.value)
      discordRef.value.discordState.maxRetries = parseInt(value) || 3;
  },
  'notification.discord.retry_delay': (value: string) => {
    if (discordRef.value)
      discordRef.value.discordState.retryDelay = parseInt(value) || 1000;
  },

  'notification.email.enabled': (value: string) => {
    if (emailRef.value) emailRef.value.emailState.enabled = value === 'true';
  },
  'notification.email.from': (value: string) => {
    if (emailRef.value) emailRef.value.emailState.from = value;
  },
  'notification.email.to': (value: string) => {
    if (emailRef.value) emailRef.value.emailState.to = value;
  },
  'notification.email.subject': (value: string) => {
    if (emailRef.value) emailRef.value.emailState.subject = value;
  },
  'notification.email.smtp_host': (value: string) => {
    if (emailRef.value) emailRef.value.emailState.smtpHost = value;
  },
  'notification.email.smtp_port': (value: string) => {
    if (emailRef.value)
      emailRef.value.emailState.smtpPort = parseInt(value) || 587;
  },
  'notification.email.smtp_user': (value: string) => {
    if (emailRef.value) emailRef.value.emailState.smtpUser = value;
  },
  'notification.email.smtp_pass': (value: string) => {
    if (emailRef.value) emailRef.value.emailState.smtpPass = value;
  },
  'notification.email.use_tls': (value: string) => {
    if (emailRef.value) emailRef.value.emailState.useTLS = value === 'true';
  },

  'notification.general.enable_batching': (value: string) => {
    if (batchingRef.value)
      batchingRef.value.batchingState.enableBatching = value === 'true';
  },
  'notification.general.batch_size': (value: string) => {
    if (batchingRef.value)
      batchingRef.value.batchingState.batchSize = parseInt(value) || 10;
  },
};

await settingsStore.fetchSettings();
isLoading.value = false;

watch(
  () => settingsStore.settings,
  () => {
    settingsStore.settings.forEach((setting) => {
      const mapFn = settingsMap[setting.key as keyof typeof settingsMap];
      if (mapFn) {
        mapFn(setting.value);
      }
    });
  },
  { immediate: true }
);

async function updateSettings(
  settings: Array<{ key: string; value: string }>
): Promise<void> {
  for (const setting of settings) {
    await settingsStore.updateSetting(setting.key, setting.value);
  }
}

async function saveDiscordSettings() {
  if (!discordRef.value) return;

  isSaving.value = true;
  try {
    const discordSettings = [
      {
        key: 'notification.discord.username',
        value: discordRef.value.discordState.username,
      },
      {
        key: 'notification.discord.avatar_url',
        value: discordRef.value.discordState.avatarUrl,
      },
      {
        key: 'notification.discord.max_retries',
        value: discordRef.value.discordState.maxRetries.toString(),
      },
      {
        key: 'notification.discord.retry_delay',
        value: discordRef.value.discordState.retryDelay.toString(),
      },
    ];

    await updateSettings(discordSettings);

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

async function saveEmailSettings() {
  if (!emailRef.value) return;

  isSaving.value = true;
  try {
    const emailSettings = [
      {
        key: 'notification.email.enabled',
        value: emailRef.value.emailState.enabled.toString(),
      },
      { key: 'notification.email.from', value: emailRef.value.emailState.from },
      { key: 'notification.email.to', value: emailRef.value.emailState.to },
      {
        key: 'notification.email.subject',
        value: emailRef.value.emailState.subject,
      },
      {
        key: 'notification.email.smtp_host',
        value: emailRef.value.emailState.smtpHost,
      },
      {
        key: 'notification.email.smtp_port',
        value: emailRef.value.emailState.smtpPort.toString(),
      },
      {
        key: 'notification.email.smtp_user',
        value: emailRef.value.emailState.smtpUser,
      },
      {
        key: 'notification.email.smtp_pass',
        value: emailRef.value.emailState.smtpPass,
      },
      {
        key: 'notification.email.use_tls',
        value: emailRef.value.emailState.useTLS.toString(),
      },
    ];

    await updateSettings(emailSettings);

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

async function saveBatchingSettings() {
  if (!batchingRef.value) return;

  isSaving.value = true;
  try {
    const batchingSettings = [
      {
        key: 'notification.general.enable_batching',
        value: batchingRef.value.batchingState.enableBatching.toString(),
      },
      {
        key: 'notification.general.batch_size',
        value: batchingRef.value.batchingState.batchSize.toString(),
      },
    ];

    await updateSettings(batchingSettings);

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

async function resetSettings() {
  try {
    await settingsStore.resetToDefaults();
    resetConfirmationOpen.value = false;

    toast.add({
      title: 'Success',
      description: 'All settings have been reset to default values',
      color: 'success',
    });

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
  if (!discordRef.value) return;

  isSaving.value = true;
  try {
    const testMessage = {
      subject: 'Test Notification',
      body: 'This is a test notification from Blocket Bot',
      price: { value: 1000, suffix: ' kr' },
      share_url: 'https://www.blocket.se',
      images: [
        {
          url:
            discordRef.value.discordState.avatarUrl ||
            'https://www.blocket.se/favicon.ico',
        },
      ],
    };

    await useFetch('/api/notifications/test/discord', {
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

      <div v-if="isLoading" class="space-y-6">
        <USkeleton class="h-[600px] w-full" />
      </div>

      <div v-else class="space-y-6">
        <DiscordNotifications
          ref="discordRef"
          :is-loading="isLoading"
          :is-saving="isSaving"
          :settings="discordSettings"
          @save="saveDiscordSettings"
          @test="testDiscordNotification"
        />

        <EmailNotifications
          ref="emailRef"
          :is-loading="isLoading"
          :is-saving="isSaving"
          :settings="emailSettings"
          @save="saveEmailSettings"
        />

        <BatchingSettings
          ref="batchingRef"
          :is-loading="isLoading"
          :is-saving="isSaving"
          :settings="batchingSettings"
          @save="saveBatchingSettings"
        />
      </div>
    </div>
  </div>
</template>
