<script setup lang="ts">
import cronstrue from 'cronstrue';
import { h, resolveComponent } from 'vue';
import { upperFirst } from 'scule';

import { NOTIFICATION_ICON_MAP } from '~/constants';

import WatcherModal from '~/components/modals/WatcherModal.vue';

import type { TableColumn } from '@nuxt/ui';
import type { Watcher, NotificationKind, Notification } from '~/types';

const UButton = resolveComponent('UButton');
const UCheckbox = resolveComponent('UCheckbox');
const UBadge = resolveComponent('UBadge');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const UIcon = resolveComponent('UIcon');
const UTooltip = resolveComponent('UTooltip');

const watcherStore = useWatcherStore();
const toast = useToast();
const overlay = useOverlay();

const modal = overlay.create(WatcherModal, {
  props: {
    onCancel: () => modal.close(),
    onSuccess: () => {
      modal.close();
      refresh();
    },
  },
});

async function openWatcherModal(watcher: Watcher) {
  await modal.open({ watcher });
}

await watcherStore.refresh();
const { watchers } = storeToRefs(watcherStore);

const refreshing = ref(false);
async function refresh() {
  try {
    refreshing.value = true;

    await watcherStore.refresh();
  } catch (error) {
    toast.add({
      title: 'Failed to refresh watchers',
      color: 'error',
      icon: 'i-lucide-circle-x',
    });
    console.error('Failed to refresh watchers:', error);
  } finally {
    refreshing.value = false;
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

const columns: ComputedRef<TableColumn<Watcher>[]> = computed(() => [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'aria-label': 'Select all',
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          row.toggleSelected(!!value),
        'aria-label': 'Select row',
      }),
    enableSorting: false,
    enableHiding: false,
  },
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
                  // Add delete confirmation logic
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
