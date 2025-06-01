<script lang="ts" setup>
import BlocketQuerySettings from '~/components/settings/general/BlocketQuerySettings.vue';
import BlocketApiSettings from '~/components/settings/general/BlocketApiSettings.vue';

definePageMeta({
  layout: 'default',
});

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const toast = useToast();

const { settings } = storeToRefs(settingsStore);

type BlocketQueryRef = {
  blocketQueryState: {
    limit: number;
    sort: 'rel' | 'dat' | 'pri';
    listingType: 's' | 'w';
    status: 'active' | 'all';
    geolocation: number;
    include: string;
  };
  updateInitialData: () => void;
};

type BlocketApiRef = {
  blocketApiState: {
    maxRetries: number;
    retryDelay: number;
    timeout: number;
  };
  updateInitialData: () => void;
};

const blocketQueryRef = ref<BlocketQueryRef | null>(null);
const blocketApiRef = ref<BlocketApiRef | null>(null);

const isLoading = ref(true);
const isSaving = ref(false);
const resetConfirmationOpen = ref(false);

const settingsMap = {
  'blocket.query.limit': (value: string) => {
    if (blocketQueryRef.value)
      blocketQueryRef.value.blocketQueryState.limit = parseInt(value) || 60;
  },
  'blocket.query.sort': (value: string) => {
    if (blocketQueryRef.value)
      blocketQueryRef.value.blocketQueryState.sort = value as 'rel';
  },
  'blocket.query.listing_type': (value: string) => {
    if (blocketQueryRef.value)
      blocketQueryRef.value.blocketQueryState.listingType = value as 's' | 'w';
  },
  'blocket.query.status': (value: string) => {
    if (blocketQueryRef.value)
      blocketQueryRef.value.blocketQueryState.status = value as 'active';
  },
  'blocket.query.geolocation': (value: string) => {
    if (blocketQueryRef.value)
      blocketQueryRef.value.blocketQueryState.geolocation =
        parseInt(value) || 3;
  },
  'blocket.query.include': (value: string) => {
    if (blocketQueryRef.value)
      blocketQueryRef.value.blocketQueryState.include = value;
  },
  'blocket.api.max_retries': (value: string) => {
    if (blocketApiRef.value)
      blocketApiRef.value.blocketApiState.maxRetries = parseInt(value) || 5;
  },
  'blocket.api.retry_delay': (value: string) => {
    if (blocketApiRef.value)
      blocketApiRef.value.blocketApiState.retryDelay = parseInt(value) || 3000;
  },
  'blocket.api.timeout': (value: string) => {
    if (blocketApiRef.value)
      blocketApiRef.value.blocketApiState.timeout = parseInt(value) || 15000;
  },
};

onMounted(async () => {
  try {
    // Ensure auth is properly initialized before fetching settings
    if (authStore.token) {
      await authStore.checkAndRefreshToken();
    }

    // Only fetch settings if we're authenticated
    if (authStore.isAuthenticated) {
      await settingsStore.fetchSettings();
    }
  } catch (error) {
    console.error('Error initializing settings page:', error);
  } finally {
    isLoading.value = false;
  }
});

watch(
  () => settingsStore.settings,
  () => {
    settings.value.forEach((setting: Setting) => {
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

async function saveBlocketQuerySettings() {
  if (!blocketQueryRef.value) return;

  isSaving.value = true;
  try {
    const querySettings = [
      {
        key: 'blocket.query.limit',
        value: blocketQueryRef.value.blocketQueryState.limit.toString(),
      },
      {
        key: 'blocket.query.sort',
        value: blocketQueryRef.value.blocketQueryState.sort,
      },
      {
        key: 'blocket.query.listing_type',
        value: blocketQueryRef.value.blocketQueryState.listingType,
      },
      {
        key: 'blocket.query.status',
        value: blocketQueryRef.value.blocketQueryState.status,
      },
      {
        key: 'blocket.query.geolocation',
        value: blocketQueryRef.value.blocketQueryState.geolocation.toString(),
      },
      {
        key: 'blocket.query.include',
        value: blocketQueryRef.value.blocketQueryState.include,
      },
    ];

    await updateSettings(querySettings);

    // Update initial data to reflect successful save
    blocketQueryRef.value?.updateInitialData();

    toast.add({
      title: 'Success',
      description: 'Blocket query settings saved',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save Blocket query settings',
      color: 'error',
    });
    console.error('Failed to save Blocket query settings:', error);
  } finally {
    isSaving.value = false;
  }
}

async function saveBlocketApiSettings() {
  if (!blocketApiRef.value) return;

  isSaving.value = true;
  try {
    const apiSettings = [
      {
        key: 'blocket.api.max_retries',
        value: blocketApiRef.value.blocketApiState.maxRetries.toString(),
      },
      {
        key: 'blocket.api.retry_delay',
        value: blocketApiRef.value.blocketApiState.retryDelay.toString(),
      },
      {
        key: 'blocket.api.timeout',
        value: blocketApiRef.value.blocketApiState.timeout.toString(),
      },
    ];

    await updateSettings(apiSettings);

    // Update initial data to reflect successful save
    blocketApiRef.value?.updateInitialData();

    toast.add({
      title: 'Success',
      description: 'Blocket API settings saved',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save Blocket API settings',
      color: 'error',
    });
    console.error('Failed to save Blocket API settings:', error);
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
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="max-w-7xl mx-auto">
      <header class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">General Settings</h1>
          <p class="text-neutral-500 mt-2">
            Configure general application settings
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
        <USkeleton class="h-[400px] w-full" />
      </div>

      <div v-else class="space-y-6">
        <BlocketQuerySettings
          ref="blocketQueryRef"
          :is-loading="isLoading"
          :is-saving="isSaving"
          :settings="{
            limit:
              parseInt(settingsStore.getSettingValue('blocket.query.limit')) ||
              60,
            sort: settingsStore.getSettingValue('blocket.query.sort') || 'rel',
            listingType:
              settingsStore.getSettingValue('blocket.query.listing_type') ||
              's',
            status:
              settingsStore.getSettingValue('blocket.query.status') || 'active',
            geolocation:
              parseInt(
                settingsStore.getSettingValue('blocket.query.geolocation')
              ) || 3,
            include:
              settingsStore.getSettingValue('blocket.query.include') ||
              'extend_with_shipping',
          }"
          @save="saveBlocketQuerySettings"
        />

        <BlocketApiSettings
          ref="blocketApiRef"
          :is-loading="isLoading"
          :is-saving="isSaving"
          :settings="{
            maxRetries:
              parseInt(
                settingsStore.getSettingValue('blocket.api.max_retries')
              ) || 5,
            retryDelay:
              parseInt(
                settingsStore.getSettingValue('blocket.api.retry_delay')
              ) || 3000,
            timeout:
              parseInt(settingsStore.getSettingValue('blocket.api.timeout')) ||
              15000,
          }"
          @save="saveBlocketApiSettings"
        />
      </div>
    </div>
  </div>
</template>
