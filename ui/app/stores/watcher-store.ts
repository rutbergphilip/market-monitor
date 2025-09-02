import type { Watcher } from '../../shared/types/watchers';

export const useWatcherStore = defineStore('watcher', () => {
  const watchers = ref<Watcher[]>([]);
  const activeWatchers = computed(() =>
    watchers.value.filter((w: Watcher) => w.status === 'active')
  );

  const authStore = useAuthStore();

  const getAll = async () => {
    try {
      const { data } = await useFetch<Watcher[]>('/api/watchers', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
        credentials: 'include',
        onResponse: [refreshTokenInterceptor],
      });

      if (!data.value) {
        throw new Error('Failed to fetch watchers');
      }

      watchers.value = data.value;
      return watchers.value;
    } catch (error) {
      console.error('Error fetching watchers:', error);
      throw new Error('Failed to fetch watchers');
    }
  };

  const refresh = async () => {
    try {
      const { data } = await useFetch<Watcher[]>('/api/watchers', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
        credentials: 'include',
        onResponse: [refreshTokenInterceptor],
      });

      if (!data.value) {
        throw new Error('Failed to refresh watchers');
      }

      watchers.value = data.value;
    } catch (error) {
      console.error('Error refreshing watchers:', error);
      throw new Error('Failed to refresh watchers');
    }
  };

  const create = async (watcher: Watcher) => {
    const { data } = await useFetch<Watcher>('/api/watchers', {
      method: 'POST',
      body: watcher,
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
      credentials: 'include',
      onResponse: [refreshTokenInterceptor],
    });

    if (!data.value) {
      throw new Error('Failed to create watcher');
    }

    watchers.value.push(data.value);
    return data.value;
  };

  const update = async (watcher: Watcher) => {
    const { data } = await useFetch<Watcher>(`/api/watchers/${watcher.id}`, {
      method: 'PATCH',
      body: watcher,
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
      credentials: 'include',
      onResponse: [refreshTokenInterceptor],
    });

    if (!data.value) {
      throw new Error('Failed to update watcher');
    }

    const index = watchers.value.findIndex((w: Watcher) => w.id === watcher.id);
    if (index !== -1) {
      watchers.value[index] = data.value;
    }

    return data.value;
  };

  const remove = async (id: string) => {
    const { status } = await useFetch(`/api/watchers/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
      credentials: 'include',
      onResponse: [refreshTokenInterceptor],
    });

    if (status.value !== 'success') {
      throw new Error('Failed to delete watcher');
    }

    watchers.value = watchers.value.filter((w: Watcher) => w.id !== id);
  };

  const getById = (id: string) => {
    return watchers.value.find((w: Watcher) => w.id === id);
  };

  const stop = async (id: string) => {
    await useFetch(`/api/watchers/${id}/stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
      credentials: 'include',
      onResponse: [refreshTokenInterceptor],
    });

    const index = watchers.value.findIndex((w: Watcher) => w.id === id);
    if (index !== -1) {
      watchers.value[index]!.status = 'stopped';
    }
  };

  const start = async (id: string) => {
    await useFetch(`/api/watchers/${id}/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
      credentials: 'include',
      onResponse: [refreshTokenInterceptor],
    });

    const index = watchers.value.findIndex((w: Watcher) => w.id === id);
    if (index !== -1) {
      watchers.value[index]!.status = 'active';
    }
  };

  const trigger = async (id: string) => {
    await useFetch(`/api/watchers/${id}/trigger`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
      credentials: 'include',
      onResponse: [refreshTokenInterceptor],
    });
  };

  return {
    getAll,
    refresh,
    getById,
    create,
    update,
    remove,
    stop,
    start,
    trigger,
    watchers,
    activeWatchers,
  };
});
