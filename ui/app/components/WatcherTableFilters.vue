<script setup lang="ts">
import { upperFirst } from 'scule';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
  refreshing: boolean;
  activeFilters: Array<{
    column: string;
    value: unknown;
    displayValue: string;
    label: string;
  }>;
}

interface Emits {
  refresh: [];
  clearAllFilters: [];
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <div>
    <!-- Filter Controls -->
    <div class="flex items-center gap-2 px-4 py-3.5 overflow-x-auto">
      <!-- Search Input -->
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400"
          >Search</span
        >
        <UInput
          :model-value="(table?.tableApi?.getColumn('queries')?.getFilterValue() as string)"
          class="max-w-sm min-w-[12ch]"
          placeholder="Search queries..."
          @update:model-value="
            table?.tableApi?.getColumn('queries')?.setFilterValue($event)
          "
        />
      </div>

      <!-- Marketplace Filter -->
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400"
          >Marketplace</span
        >
        <USelect
          :model-value="(table?.tableApi?.getColumn('marketplace')?.getFilterValue() as string) || ''"
          :options="[
            { value: '', label: 'All' },
            { value: 'BLOCKET', label: 'Blocket' },
            { value: 'TRADERA', label: 'Tradera' },
          ]"
          placeholder="All"
          class="min-w-[10ch]"
          @update:model-value="
            table?.tableApi
              ?.getColumn('marketplace')
              ?.setFilterValue($event || undefined)
          "
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex items-end gap-2 ml-auto">
        <UButton
          :loading="refreshing"
          icon="i-lucide-refresh-cw"
          variant="ghost"
          color="neutral"
          aria-label="Refresh"
          @click="$emit('refresh')"
        />

        <UButton
          icon="i-lucide-filter-x"
          variant="ghost"
          color="neutral"
          aria-label="Clear filters"
          @click="$emit('clearAllFilters')"
        />

        <UDropdownMenu
          :items="table?.tableApi?.getAllColumns().filter((column: any) => column.getCanHide()).map((column: any) => ({
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
            aria-label="Column visibility"
          />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Active Filters Display -->
    <div
      v-if="activeFilters.length > 0"
      class="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border-b border-(--ui-border-accented)"
    >
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm text-neutral-600 dark:text-neutral-400"
          >Filters:</span
        >
        <UBadge
          v-for="filter in activeFilters"
          :key="`${filter.column}-${filter.value}`"
          variant="subtle"
          color="primary"
          class="gap-1"
        >
          <span class="text-xs"
            >{{ filter.label }}: {{ filter.displayValue }}</span
          >
          <template #trailing>
            <UButton
              icon="i-lucide-x"
              size="xs"
              variant="ghost"
              color="error"
              @click="
                table?.tableApi
                  ?.getColumn(filter.column)
                  ?.setFilterValue(undefined)
              "
            />
          </template>
        </UBadge>
        <UButton
          v-if="activeFilters.length > 1"
          label="Clear all"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="$emit('clearAllFilters')"
        />
      </div>
    </div>
  </div>
</template>
