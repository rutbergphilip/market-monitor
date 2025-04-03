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
const blocketQuerySchema = z.object({
  limit: z.number().int().min(1, 'Min 1').max(100, 'Max 100'),
  sort: z.enum(['rel', 'dat', 'pri']),
  listingType: z.enum(['s', 'w']),
  status: z.enum(['active', 'all']),
  geolocation: z.number().int().min(1, 'Min 1'),
  include: z.string(),
});

// Form states
const blocketQueryState = reactive({
  limit: 60,
  sort: 'rel',
  listingType: 's',
  status: 'active',
  geolocation: 3,
  include: 'extend_with_shipping',
});

const pricingState = reactive({
  active: false,
  min: '',
  max: '',
  currency: 'SEK',
});

// Load settings from the store
onMounted(async () => {
  isLoading.value = true;
  try {
    await settingsStore.fetchSettings();

    // Map settings to state objects
    settingsStore.settings.forEach((setting) => {
      if (setting.key === 'blocket.query.limit') {
        blocketQueryState.limit = parseInt(setting.value) || 60;
      } else if (setting.key === 'blocket.query.sort') {
        blocketQueryState.sort = setting.value as 'rel' | 'dat' | 'pri';
      } else if (setting.key === 'blocket.query.listing_type') {
        blocketQueryState.listingType = setting.value as 's' | 'w';
      } else if (setting.key === 'blocket.query.status') {
        blocketQueryState.status = setting.value as 'active' | 'all';
      } else if (setting.key === 'blocket.query.geolocation') {
        blocketQueryState.geolocation = parseInt(setting.value) || 3;
      } else if (setting.key === 'blocket.query.include') {
        blocketQueryState.include = setting.value;
      } else if (setting.key === 'monitoring.pricing.active') {
        pricingState.active = setting.value === 'true';
      } else if (setting.key === 'monitoring.pricing.min') {
        pricingState.min = setting.value;
      } else if (setting.key === 'monitoring.pricing.max') {
        pricingState.max = setting.value;
      } else if (setting.key === 'monitoring.pricing.currency') {
        pricingState.currency = setting.value;
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

// Save Blocket Query settings
async function saveBlocketQuerySettings() {
  isSaving.value = true;
  try {
    await settingsStore.updateSetting(
      'blocket.query.limit',
      blocketQueryState.limit.toString()
    );
    await settingsStore.updateSetting(
      'blocket.query.sort',
      blocketQueryState.sort
    );
    await settingsStore.updateSetting(
      'blocket.query.listing_type',
      blocketQueryState.listingType
    );
    await settingsStore.updateSetting(
      'blocket.query.status',
      blocketQueryState.status
    );
    await settingsStore.updateSetting(
      'blocket.query.geolocation',
      blocketQueryState.geolocation.toString()
    );
    await settingsStore.updateSetting(
      'blocket.query.include',
      blocketQueryState.include
    );

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
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="max-w-4xl mx-auto">
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

      <div v-if="isLoading" class="flex justify-center my-10">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
      </div>

      <div v-else class="space-y-6">
        <!-- Blocket Query Settings -->
        <UCard>
          <template #header>
            <div class="flex items-center">
              <UIcon name="ic:baseline-search" class="mr-2 text-xl" />
              <h2 class="text-lg font-semibold">Blocket Query Settings</h2>
            </div>
          </template>
          <UForm
            :schema="blocketQuerySchema"
            :state="blocketQueryState"
            class="space-y-4"
            @submit="saveBlocketQuerySettings"
          >
            <div class="mb-4">
              <div class="mb-1">
                <label for="results-limit" class="block font-medium text-sm"
                  >Results Limit</label
                >
              </div>
              <UInput
                id="results-limit"
                v-model.number="blocketQueryState.limit"
                type="number"
                :min="1"
                :max="60"
              />
              <p class="text-xs text-neutral-500 mt-1">
                Maximum number of results to fetch per query
              </p>
            </div>

            <div class="flex justify-end mt-4">
              <UButton type="submit" :loading="isSaving"
                >Save Query Settings</UButton
              >
            </div>
          </UForm>
        </UCard>
      </div>
    </div>
  </div>
</template>
