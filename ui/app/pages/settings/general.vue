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

const pricingSchema = z.object({
  active: z.boolean(),
  min: z.string(),
  max: z.string(),
  currency: z.string().min(1, 'Required'),
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

// Save Price Monitoring settings
async function savePricingSettings() {
  isSaving.value = true;
  try {
    await settingsStore.updateSetting(
      'monitoring.pricing.active',
      pricingState.active.toString()
    );
    await settingsStore.updateSetting(
      'monitoring.pricing.min',
      pricingState.min
    );
    await settingsStore.updateSetting(
      'monitoring.pricing.max',
      pricingState.max
    );
    await settingsStore.updateSetting(
      'monitoring.pricing.currency',
      pricingState.currency
    );

    toast.add({
      title: 'Success',
      description: 'Price monitoring settings saved',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save price monitoring settings',
      color: 'error',
    });
    console.error('Failed to save price monitoring settings:', error);
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
            <UFormGroup
              label="Results Limit"
              name="limit"
              help="Maximum number of results to fetch per query"
            >
              <UInput
                v-model.number="blocketQueryState.limit"
                type="number"
                :min="1"
                :max="100"
              />
            </UFormGroup>

            <UFormGroup
              label="Sort Order"
              name="sort"
              help="How to sort the search results"
            >
              <URadioGroup v-model="blocketQueryState.sort" class="flex gap-4">
                <URadio value="rel" label="Relevance" />
                <URadio value="dat" label="Date (Newest first)" />
                <URadio value="pri" label="Price (Lowest first)" />
              </URadioGroup>
            </UFormGroup>

            <UFormGroup
              label="Listing Type"
              name="listingType"
              help="Type of listings to search for"
            >
              <URadioGroup
                v-model="blocketQueryState.listingType"
                class="flex gap-4"
              >
                <URadio value="s" label="Selling" />
                <URadio value="w" label="Wanted" />
              </URadioGroup>
            </UFormGroup>

            <UFormGroup
              label="Status"
              name="status"
              help="Status of listings to fetch"
            >
              <URadioGroup
                v-model="blocketQueryState.status"
                class="flex gap-4"
              >
                <URadio value="active" label="Active only" />
                <URadio value="all" label="All listings" />
              </URadioGroup>
            </UFormGroup>

            <UFormGroup
              label="Geolocation"
              name="geolocation"
              help="Geographical area to search in"
            >
              <URadioGroup
                v-model="blocketQueryState.geolocation"
                class="flex gap-4"
              >
                <URadio :value="3" label="Sweden (3)" />
              </URadioGroup>
            </UFormGroup>

            <UFormGroup
              label="Include"
              name="include"
              help="Additional data to include in results"
            >
              <URadioGroup
                v-model="blocketQueryState.include"
                class="flex gap-4"
              >
                <URadio
                  value="extend_with_shipping"
                  label="With shipping info"
                />
                <URadio value="" label="Basic data" />
              </URadioGroup>
            </UFormGroup>

            <div class="flex justify-end mt-4">
              <UButton type="submit" :loading="isSaving"
                >Save Query Settings</UButton
              >
            </div>
          </UForm>
        </UCard>

        <!-- Price Monitoring Settings -->
        <UCard>
          <template #header>
            <div class="flex items-center">
              <UIcon name="mdi:currency-usd" class="mr-2 text-xl" />
              <h2 class="text-lg font-semibold">Price Monitoring</h2>
              <UBadge class="ml-2" color="neutral">Beta</UBadge>
            </div>
          </template>
          <UForm
            :schema="pricingSchema"
            :state="pricingState"
            class="space-y-4"
            @submit="savePricingSettings"
          >
            <UFormGroup class="flex items-center space-x-2">
              <UCheckbox v-model="pricingState.active" name="active" />
              <span class="font-medium">Monitor price changes</span>
            </UFormGroup>

            <div class="flex gap-4">
              <UFormGroup
                label="Min Price"
                name="min"
                help="Minimum price to monitor (leave empty for no minimum)"
                class="flex-1"
              >
                <UInput
                  v-model="pricingState.min"
                  placeholder="0"
                  :disabled="!pricingState.active"
                />
              </UFormGroup>

              <UFormGroup
                label="Max Price"
                name="max"
                help="Maximum price to monitor (leave empty for no maximum)"
                class="flex-1"
              >
                <UInput
                  v-model="pricingState.max"
                  placeholder="10000"
                  :disabled="!pricingState.active"
                />
              </UFormGroup>
            </div>

            <UFormGroup
              label="Currency"
              name="currency"
              help="Currency for price monitoring"
            >
              <URadioGroup
                v-model="pricingState.currency"
                class="flex gap-4"
                :disabled="!pricingState.active"
              >
                <URadio value="SEK" label="SEK" />
                <URadio value="EUR" label="EUR" />
                <URadio value="USD" label="USD" />
              </URadioGroup>
            </UFormGroup>

            <div class="flex justify-end mt-4">
              <UButton type="submit" :loading="isSaving"
                >Save Price Settings</UButton
              >
            </div>
          </UForm>
        </UCard>
      </div>
    </div>
  </div>
</template>
