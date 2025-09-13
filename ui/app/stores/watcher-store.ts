import type { Watcher } from '../../shared/types/watchers';

export const useWatcherStore = defineStore('watcher', () => {
  const watchers = ref<Watcher[]>([]);
  const updateTrigger = ref(0); // Force reactivity trigger
  
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

  // Methods to update watcher state based on SSE events
  const updateWatcherStatus = (
    watcherId: string | number,
    updates: Partial<Watcher>
  ) => {
    const index = watchers.value.findIndex(
      (w: Watcher) => w.id === watcherId.toString() || w.id === watcherId
    );
    if (index !== -1) {
      // Create a new object with the updates to trigger reactivity
      const currentWatcher = watchers.value[index];
      const updatedWatcher: Watcher = {
        ...currentWatcher,
        ...updates,
        // Ensure queries is always an array to satisfy TypeScript
        queries: updates.queries || currentWatcher?.queries || [],
        // Ensure notifications is always an array to satisfy TypeScript
        notifications:
          updates.notifications || currentWatcher?.notifications || [],
        // Ensure schedule is always a string to satisfy TypeScript
        schedule: updates.schedule || currentWatcher?.schedule || '',
      };
      
      // Use splice to ensure reactivity is triggered properly
      watchers.value.splice(index, 1, updatedWatcher);
      
      // Force reactivity update with trigger
      updateTrigger.value++;
      
      // Force reactivity update
      nextTick(() => {
        console.log('[Watcher Store] 🔄 Updated watcher (after nextTick):', {
          watcherId,
          updates,
          updatedWatcher,
          currentArrayLength: watchers.value.length,
          updateTrigger: updateTrigger.value,
        });
      });

      console.log('[Watcher Store] 🔄 Updated watcher:', {
        watcherId,
        updates,
        updatedWatcher,
        currentArrayLength: watchers.value.length,
        updateTrigger: updateTrigger.value,
      });
    } else {
      console.warn(
        '[Watcher Store] ⚠️ Watcher not found for update:',
        watcherId
      );
    }
  };

  const updateWatcherFromSSE = (event: {
    watcherId: string | number;
    status?: 'active' | 'stopped' | 'running' | 'error' | 'idle';
    message?: string;
    lastRun?: string;
    nextRun?: string;
    newAdsCount?: number;
    error?: string;
  }) => {
    const updates: Partial<Watcher> = {};

    // Map SSE status to watcher status
    if (event.status) {
      switch (event.status) {
        case 'running':
          // Keep the watcher status as 'active' when running, but we could add a running indicator
          updates.status = 'active';
          break;
        case 'idle':
          // Job completed, keep as active
          updates.status = 'active';
          break;
        case 'error':
          // Mark as error status - you might want to add this to your Watcher type
          updates.status = 'active'; // Keep active but could add error indicator
          break;
        default:
          updates.status = event.status;
      }
    }

    if (event.lastRun) {
      updates.last_run = event.lastRun;
    }

    // Log the SSE event processing
    console.log('[Watcher Store] 📡 Processing SSE event:', {
      event,
      updates,
      watcherId: event.watcherId,
    });

    updateWatcherStatus(event.watcherId, updates);
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
    updateWatcherStatus,
    updateWatcherFromSSE,
    updateTrigger, // Export the trigger for potential use in components
  };
});
