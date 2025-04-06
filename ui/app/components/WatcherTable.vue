<script setup lang="ts">
import cronstrue from 'cronstrue';
import { h, resolveComponent } from 'vue';
import { upperFirst } from 'scule';

import { NOTIFICATION_ICON_MAP } from '~/constants';

import WatcherModal from '~/components/modals/WatcherModal.vue';
import ConfirmationModal from '~/components/modals/ConfirmationModal.vue';

import type { TableColumn } from '@nuxt/ui';
import type { Watcher, NotificationKind, Notification } from '~/types';

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const UIcon = resolveComponent('UIcon');
const UTooltip = resolveComponent('UTooltip');

const watcherStore = useWatcherStore();
const authStore = useAuthStore();
const toast = useToast();
const overlay = useOverlay();

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

async function openWatcherModal(watcher: Watcher) {
  await watcherModal.open({ watcher });
}

async function openConfirmationModal(watcherId: string) {
  const confirmed = await confirmationModal.open();

  if (confirmed) {
    await deleteWatcher(watcherId);
  }
}

const { watchers } = storeToRefs(watcherStore);

const refreshing = ref(false);
const isLoading = ref(true);
const hasError = ref(false);

async function refresh() {
  if (!authStore.isAuthenticated) {
    console.log('Not authenticated, skipping refresh');
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

// Only fetch watchers once we know user is authenticated
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await refresh();
  }
});

// Watch for authentication state changes
watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      await refresh();
    }
  }
);

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

const columns: ComputedRef<TableColumn<Watcher>[]> = computed(() => [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => `#${row.getValue('id')}`,
  },
  {
    accessorKey: 'query',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Query',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      });
    },
    cell: ({ row }) => h('div', { class: 'lowercase' }, row.getValue('query')),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const watcher = row.original;

      const status = watcher.status;

      const color =
        status === 'active'
          ? 'success'
          : status === 'stopped'
          ? 'error'
          : 'neutral';

      return h(
        UBadge,
        { class: 'capitalize', variant: 'subtle', color },
        () => status
      );
    },
  },
  {
    accessorKey: 'schedule',
    header: 'Schedule',
    cell: ({ row }) => {
      const schedule = row.getValue('schedule') as string;

      return h(
        UTooltip,
        {
          text: cronstrue.toString(schedule),
          placement: 'bottom',
          delayDuration: 200,
        },
        h(
          'p',
          {
            class: 'lowercase',
          },
          schedule
        )
      );
    },
  },
  {
    id: 'price_range',
    header: 'Price Range',
    cell: ({ row }) => {
      const watcher = row.original;
      const minPrice = watcher.min_price;
      const maxPrice = watcher.max_price;

      if (minPrice === null && maxPrice === null) {
        return h('span', { class: 'text-neutral-500' }, 'Any price');
      }

      if (minPrice !== null && maxPrice !== null) {
        return h('span', {}, `${minPrice} - ${maxPrice} SEK`);
      }

      if (minPrice !== null) {
        return h('span', {}, `Min: ${minPrice} SEK`);
      }

      if (maxPrice !== null) {
        return h('span', {}, `Max: ${maxPrice} SEK`);
      }

      return h('span', { class: 'text-neutral-500' }, 'Any price');
    },
  },
  {
    accessorKey: 'last_run',
    header: 'Last Run',
    cell: ({ row }) => {
      return new Date(row.getValue('last_run')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    },
  },
  {
    accessorKey: 'notifications',
    header: () => h('div', { class: 'text-left' }, 'Enabled Notifications'),
    cell: ({ row }) => {
      const notifications = row.getValue('notifications') as Notification[];

      return h(
        'div',
        { class: 'flex flex-wrap items-center justify-start gap-2' },
        notifications.map((notification) =>
          h(UIcon, {
            name: NOTIFICATION_ICON_MAP[notification.kind as NotificationKind],
            class: 'text-lg',
            title: notification,
          })
        )
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const watcher = row.original;

      return h('div', { class: 'flex items-center justify-end gap-2' }, [
        watcher.status === 'active'
          ? h(
              UTooltip,
              {
                text: 'Pause',
                placement: 'top',
                delayDuration: 200,
              },
              h(UButton, {
                icon: 'i-lucide-pause',
                color: 'error',
                variant: 'ghost',
                size: 'xl',
                'aria-label': 'Pause',
                onClick: () => {
                  stop(watcher.id!);
                },
              })
            )
          : h(
              UTooltip,
              {
                text: 'Start',
                placement: 'top',
                delayDuration: 200,
              },
              h(UButton, {
                icon: 'i-lucide-play',
                color: 'success',
                variant: 'ghost',
                size: 'xl',
                'aria-label': 'Start',
                onClick: () => {
                  start(watcher.id!);
                },
              })
            ),

        // Edit button with tooltip
        h(
          UTooltip,
          {
            text: 'Edit',
            placement: 'top',
            delayDuration: 200,
          },
          h(UButton, {
            icon: 'i-lucide-pencil',
            color: 'neutral',
            variant: 'ghost',
            size: 'xl',
            'aria-label': 'Edit',
            onClick: () => {
              openWatcherModal(watcher);
            },
          })
        ),

        // Trigger button with tooltip
        h(
          UTooltip,
          {
            text: 'Trigger',
            placement: 'top',
            delayDuration: 200,
          },
          h(UButton, {
            icon: 'i-lucide-zap',
            color: 'success',
            variant: 'ghost',
            size: 'xl',
            'aria-label': 'Trigger',
            onClick: () => {
              trigger(watcher.id!);
            },
          })
        ),

        // Actions dropdown (kept for other actions)
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end',
            },
            items: [
              {
                type: 'label',
                label: 'Actions',
              },
              {
                label: 'Copy ID',
                onSelect() {
                  navigator.clipboard.writeText(row.original.id!);
                  toast.add({
                    title: 'ID copied to clipboard!',
                    color: 'success',
                    icon: 'i-lucide-circle-check',
                  });
                },
              },
              {
                label: row.getIsExpanded() ? 'Collapse' : 'Expand',
                onSelect() {
                  row.toggleExpanded();
                },
              },
              {
                type: 'separator',
              },
              {
                label: 'Delete',
                color: 'error',
                onSelect() {
                  openConfirmationModal(watcher.id!);
                },
              },
            ],
            'aria-label': 'Actions dropdown',
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              size: 'xl',
              'aria-label': 'Actions dropdown',
            })
        ),
      ]);
    },
  },
  {
    accessorKey: 'header',
    header: () =>
      h(
        UTooltip,
        {
          text: 'Refresh',
          placement: 'bottom',
          delayDuration: 200,
          loading: refreshing.value,
          onClick: () => refresh(),
        },
        h(UButton, {
          leadingIcon: 'i-lucide-refresh-cw',
          variant: 'link',
          color: 'neutral',
          ui: { leadingIcon: 'scale-150' },
        })
      ),
  },
]);

const table = useTemplateRef('table');
</script>

<template>
  <div class="flex-1 divide-y divide-(--ui-border-accented) w-full">
    <!-- Error message when authentication fails -->
    <div v-if="hasError" class="p-4 text-center">
      <p class="text-red-500 mb-2">Failed to load watchers</p>
      <UButton @click="refresh" label="Try again" />
    </div>

    <div class="flex items-center gap-2 px-4 py-3.5 overflow-x-auto">
      <UInput
        :model-value="(table?.tableApi?.getColumn('query')?.getFilterValue() as string)"
        class="max-w-sm min-w-[12ch]"
        placeholder="Filter"
        @update:model-value="
          table?.tableApi?.getColumn('query')?.setFilterValue($event)
        "
      />

      <UDropdownMenu
        :items="table?.tableApi?.getAllColumns().filter(column => column.getCanHide()).map(column => ({
          label: upperFirst(column.id),
          type: 'checkbox' as const,
          checked: column.getIsVisible(),
          onUpdateChecked(checked: boolean) {
            table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
          },
          onSelect(e?: Event) {
            e?.preventDefault()
          }
        }))"
        :content="{ align: 'end' }"
      >
        <UButton
          label="Columns"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-chevron-down"
          class="ml-auto"
          aria-label="Columns select dropdown"
        />
      </UDropdownMenu>
    </div>

    <UTable
      ref="table"
      :data="watchers ?? []"
      :columns="columns"
      :loading="refreshing"
      sticky
      class="h-96"
      aria-label="Watcher table"
    >
      <template #expanded="{ row }">
        <pre>{{ row.original }}</pre>
      </template>
    </UTable>

    <div class="px-4 py-3.5 text-sm text-(--ui-text-muted)">
      {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
      {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s)
      selected.
    </div>
  </div>
</template>
