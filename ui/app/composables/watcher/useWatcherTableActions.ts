import WatcherModal from '~/components/modals/WatcherModal.vue';
import ConfirmationModal from '~/components/modals/ConfirmationModal.vue';

export function useWatcherTableActions() {
  const watcherStore = useWatcherStore();
  const authStore = useAuthStore();
  const toast = useToast();
  const overlay = useOverlay();

  const refreshing = ref(false);
  const isLoading = ref(true);
  const hasError = ref(false);

  // Modal setup
  const watcherModal = overlay.create(WatcherModal, {
    props: {
      onCancel: () => watcherModal.close(),
      onSuccess: () => {
        watcherModal.close();
        refresh();
      },
    },
  });

  const confirmationModal = overlay.create(ConfirmationModal, {
    props: {
      title: 'Delete Watcher',
      message:
        'Are you sure you want to delete this watcher? This action cannot be undone.',
      onCancel: () => confirmationModal.close(),
      onConfirm: (watcherId: string) => {
        confirmationModal.close();
        deleteWatcher(watcherId);
      },
    },
  });

  // Modal actions
  async function openWatcherModal(watcher: Watcher) {
    await watcherModal.open({ watcher });
  }

  async function openConfirmationModal(watcherId: string) {
    const confirmed = await confirmationModal.open();

    if (confirmed) {
      await deleteWatcher(watcherId);
    }
  }

  // Main actions
  async function refresh() {
    if (!authStore.isAuthenticated) {
      return;
    }

    try {
      refreshing.value = true;
      hasError.value = false;

      await watcherStore.refresh();
    } catch (error) {
      hasError.value = true;
      toast.add({
        title: 'Failed to refresh watchers',
        color: 'error',
        icon: 'i-lucide-circle-x',
      });
      console.error('Failed to refresh watchers:', error);
    } finally {
      refreshing.value = false;
      isLoading.value = false;
    }
  }

  async function start(watcherId: string) {
    try {
      await watcherStore.start(watcherId);
      toast.add({
        title: 'Watcher started',
        color: 'success',
        icon: 'i-lucide-play',
      });
    } catch (error) {
      toast.add({
        title: 'Failed to start watcher',
        color: 'error',
        icon: 'i-lucide-circle-x',
      });
      console.error('Failed to start watcher:', error);
    }
  }

  async function stop(watcherId: string) {
    try {
      await watcherStore.stop(watcherId);
      toast.add({
        title: 'Watcher paused',
        color: 'error',
        icon: 'i-lucide-pause',
      });
    } catch (error) {
      toast.add({
        title: 'Failed to pause watcher',
        color: 'error',
        icon: 'i-lucide-circle-x',
      });
      console.error('Failed to pause watcher:', error);
    }
  }

  async function deleteWatcher(watcherId: string) {
    try {
      await watcherStore.remove(watcherId);
      await refresh();
      toast.add({
        title: 'Watcher deleted',
        description: 'The watcher has been permanently deleted',
        color: 'success',
        icon: 'i-lucide-check',
      });
    } catch (error) {
      toast.add({
        title: 'Failed to delete watcher',
        description: 'An error occurred while deleting the watcher',
        color: 'error',
        icon: 'i-lucide-circle-x',
      });
      console.error('Failed to delete watcher:', error);
    }
  }

  async function trigger(watcherId: string) {
    try {
      refreshing.value = true;
      await watcherStore.trigger(watcherId);
      toast.add({
        title: 'Watcher triggered',
        description: 'The watcher job is running now',
        color: 'success',
        icon: 'i-lucide-zap',
      });
    } catch (error) {
      toast.add({
        title: 'Failed to trigger watcher',
        description: 'An error occurred while triggering the watcher',
        color: 'error',
        icon: 'i-lucide-circle-x',
      });
      console.error('Failed to trigger watcher:', error);
    } finally {
      refreshing.value = false;
    }
  }

  function clearAllFilters(table: {
    tableApi?: { resetColumnFilters: () => void };
  }) {
    // Clear all column filters
    table?.tableApi?.resetColumnFilters();

    toast.add({
      title: 'Filters cleared',
      description: 'All filters have been reset',
      color: 'success',
      icon: 'i-lucide-filter-x',
    });
  }

  // Initialization function
  async function initialize() {
    isLoading.value = true;
    await nextTick();
    if (authStore.isAuthenticated) {
      await refresh();
    }
    isLoading.value = false;
  }

  // Watch for authentication state changes
  function watchAuthState() {
    return watch(
      () => authStore.isAuthenticated,
      async (isAuthenticated) => {
        await nextTick();
        if (isAuthenticated) {
          isLoading.value = true;
          await refresh();
          isLoading.value = false;
        }
      }
    );
  }

  return {
    // State
    refreshing: readonly(refreshing),
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),

    // Actions
    refresh,
    start,
    stop,
    deleteWatcher,
    trigger,
    clearAllFilters,
    openWatcherModal,
    openConfirmationModal,
    initialize,
    watchAuthState,
  };
}
