import type { Setting } from '~/types';

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Setting[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const authStore = useAuthStore();

  const groupedSettings = computed(() => {
    const groups: Record<string, Setting[]> = {};

    for (const setting of settings.value) {
      const category = setting.key.split('.')[0] || 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(setting);
    }

    return groups;
  });

  const getSettingValue = (key: string): string => {
    const setting = settings.value.find((s) => s.key === key);
    return setting ? setting.value : '';
  };

  const fetchSettings = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data } = await useFetch<Setting[]>('/api/settings', {
        method: 'GET',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        headers: {
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        credentials: 'include',
      });

      if (!data.value) {
        throw new Error('Failed to fetch settings');
      }

      settings.value = data.value;
      return settings.value;
    } catch (err) {
      console.error('Error fetching settings:', err);
      error.value = 'Failed to load settings. Please try again.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDefaultSettings = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data } = await useFetch<Setting[]>('/api/settings/defaults', {
        method: 'GET',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        headers: {
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        credentials: 'include',
      });

      if (!data.value) {
        throw new Error('Failed to fetch default settings');
      }

      return data.value;
    } catch (err) {
      console.error('Error fetching default settings:', err);
      error.value = 'Failed to load default settings. Please try again.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateSetting = async (key: string, value: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data } = await useFetch<Setting>(`/api/settings/${key}`, {
        method: 'PUT',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        body: { value },
        headers: {
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        credentials: 'include',
      });

      if (!data.value) {
        throw new Error('Failed to update setting');
      }

      // Update the local state
      const index = settings.value.findIndex((s) => s.key === key);
      if (index !== -1) {
        settings.value[index] = data.value;
      }

      return data.value;
    } catch (err) {
      console.error('Error updating setting:', err);
      error.value = 'Failed to update setting. Please try again.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const resetToDefaults = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data } = await useFetch('/api/settings/reset', {
        method: 'POST',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        headers: {
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        credentials: 'include',
      });

      if (!data.value) {
        throw new Error('Failed to reset settings');
      }

      await fetchSettings();

      return data.value;
    } catch (err) {
      console.error('Error resetting settings:', err);
      error.value = 'Failed to reset settings. Please try again.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    settings,
    groupedSettings,
    isLoading,
    error,
    fetchSettings,
    fetchDefaultSettings,
    updateSetting,
    resetToDefaults,
    getSettingValue,
  };
});
