<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import { upperFirst } from 'scule';

import { NOTIFICATION_ICON_MAP } from '~/constants';

import type { TableColumn } from '@nuxt/ui';
import type { Watcher, NotificationTarget } from '~/types';

const UButton = resolveComponent('UButton');
const UCheckbox = resolveComponent('UCheckbox');
const UBadge = resolveComponent('UBadge');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const UIcon = resolveComponent('UIcon');

const toast = useToast();

const data = ref<Watcher[]>([
  {
    id: '4600',
    lastRun: '2024-03-11T15:30:00',
    status: 'active',
    numberOfRuns: 5,
    query: 'Macbook Pro 16"',
    notifications: ['DISCORD'],
  },
  {
    id: '4599',
    lastRun: '2024-03-11T10:10:00',
    status: 'active',
    numberOfRuns: 3,
    query: 'iPhone 14 Pro',
    notifications: ['DISCORD', 'EMAIL'],
  },
  {
    id: '4598',
    lastRun: '2024-03-11T08:50:00',
    status: 'paused',
    numberOfRuns: 2,
    query: 'Samsung Galaxy S23',
    notifications: ['DISCORD', 'SLACK'],
  },
  {
    id: '4597',
    lastRun: '2024-03-10T19:45:00',
    status: 'active',
    numberOfRuns: 4,
    query: 'Dell Optiplex 3070 Micro',
    notifications: ['EMAIL', 'SLACK'],
  },
  {
    id: '4596',
    lastRun: '2024-03-10T15:55:00',
    status: 'paused',
    numberOfRuns: 1,
    query: 'Ikea bokhylla',
    notifications: ['DISCORD', 'EMAIL', 'SLACK'],
  },
]);

const columns: TableColumn<Watcher>[] = [
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
      const color = {
        active: 'success' as const,
        paused: 'neutral' as const,
      }[row.getValue('status') as string];

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        row.getValue('status')
      );
    },
  },
  {
    accessorKey: 'lastRun',
    header: 'Last Run',
    cell: ({ row }) => {
      return new Date(row.getValue('lastRun')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    },
  },
  {
    accessorKey: 'numberOfRuns',
    header: () => h('div', { class: 'text-right' }, 'Runs'),
    cell: ({ row }) => {
      const numberOfRuns = Number.parseFloat(row.getValue('numberOfRuns'));

      return h(
        'div',
        { class: 'text-right font-medium' },
        numberOfRuns.toString()
      );
    },
  },
  {
    accessorKey: 'notifications',
    header: () => h('div', { class: 'text-right' }, 'Active Notifications'),
    cell: ({ row }) => {
      const notifications = row.getValue(
        'notifications'
      ) as NotificationTarget[];

      return h(
        'div',
        { class: 'flex flex-wrap items-center justify-end gap-2' },
        notifications.map((notification) =>
          h(UIcon, {
            name: NOTIFICATION_ICON_MAP[notification],
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
      const items = [
        {
          type: 'label',
          label: 'Actions',
        },
        {
          label: 'Copy ID',
          onSelect() {
            navigator.clipboard.writeText(row.original.id);

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
          label: 'View details',
        },
      ];

      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end',
            },
            items,
            'aria-label': 'Actions dropdown',
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto',
              'aria-label': 'Actions dropdown',
            })
        )
      );
    },
  },
];

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
      :data="data"
      :columns="columns"
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
