import type { Watcher } from '~/types';

export const useWatcherStore = defineStore('watcher', () => {
  const watchers = ref<Watcher[]>([]);

  const getAll = async () => {
    const { data } = await useFetch<Watcher[]>('/api/watchers', {
      method: 'GET',
      baseURL: useRuntimeConfig().public.apiBaseUrl,
    });

    if (!data.value) {
      throw new Error('Failed to fetch watchers');
    }

    watchers.value = data.value;
    return watchers.value;
  };

  const refresh = async () => {
    const { data } = await useFetch<Watcher[]>('/api/watchers', {
      method: 'GET',
      baseURL: useRuntimeConfig().public.apiBaseUrl,
    });

    if (!data.value) {
      throw new Error('Failed to fetch watchers');
    }

    watchers.value = data.value;
  };

  const create = async (watcher: Watcher) => {
    const { data } = await useFetch<Watcher>('/api/watchers', {
      method: 'POST',
      baseURL: useRuntimeConfig().public.apiBaseUrl,
      body: watcher,
    });

    if (!data.value) {
      throw new Error('Failed to create watcher');
    }

    watchers.value.push(data.value);
    return data.value;
  };

  const update = async (watcher: Watcher) => {
    const { data } = await useFetch<Watcher>(`/api/watchers/${watcher.id}`, {
      method: 'PUT',
      baseURL: useRuntimeConfig().public.apiBaseUrl,
      body: watcher,
    });

    if (!data.value) {
      throw new Error('Failed to update watcher');
    }

    const index = watchers.value.findIndex((w) => w.id === watcher.id);
    if (index !== -1) {
      watchers.value[index] = data.value;
    }

    return data.value;
  };

  const remove = async (id: string) => {
    const { data } = await useFetch(`/api/watchers/${id}`, {
      method: 'DELETE',
      baseURL: useRuntimeConfig().public.apiBaseUrl,
    });

    if (!data.value) {
      throw new Error('Failed to delete watcher');
    }

    watchers.value = watchers.value.filter((w) => w.id !== id);
  };

  const getById = (id: string) => {
    return watchers.value.find((w) => w.id === id);
  };

  return { getAll, refresh, getById, create, update, remove, watchers };
});
