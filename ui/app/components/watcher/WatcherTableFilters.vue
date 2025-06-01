<script setup lang="ts">
import { useTableFiltersStore } from '~/stores/table-filters-store';

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

const props = defineProps<Props>();
defineEmits<Emits>();

const tableFiltersStore = useTableFiltersStore();

// Sync store state with table filters
onMounted(() => {
  // Initialize store from current table state
  const marketplaceFilter = props.table?.tableApi
    ?.getColumn('marketplace')
    ?.getFilterValue();
  if (marketplaceFilter) {
    if (Array.isArray(marketplaceFilter)) {
      tableFiltersStore.initializeFromMarketplaceValues(marketplaceFilter);
    } else if (typeof marketplaceFilter === 'string') {
      tableFiltersStore.initializeFromMarketplaceValues([marketplaceFilter]);
    }
  }

  const searchFilter = props.table?.tableApi
    ?.getColumn('queries')
    ?.getFilterValue();
  if (typeof searchFilter === 'string') {
    tableFiltersStore.setSearchQuery(searchFilter);
  }
});

// Watch store changes and update table
watch(
  () => tableFiltersStore.marketplaceValues,
  (newValues) => {
    if (!props.table?.tableApi || tableFiltersStore.isUpdatingFromTable) return;

    const column = props.table.tableApi.getColumn('marketplace');
    const currentValue = column?.getFilterValue();

    // Only update if the values are actually different
    const currentValues = Array.isArray(currentValue)
      ? currentValue
      : currentValue && typeof currentValue === 'string'
      ? [currentValue]
      : [];

    if (
      JSON.stringify(currentValues.sort()) !== JSON.stringify(newValues.sort())
    ) {
      if (newValues.length === 0) {
        column?.setFilterValue(undefined);
      } else {
        column?.setFilterValue(newValues);
      }
    }
  }
);

watch(
  () => tableFiltersStore.searchQuery,
  (newQuery) => {
    if (!props.table?.tableApi || tableFiltersStore.isUpdatingFromTable) return;

    const column = props.table.tableApi.getColumn('queries');
    const currentValue = column?.getFilterValue() || '';

    if (currentValue !== newQuery) {
      column?.setFilterValue(newQuery || undefined);
    }
  }
);

// Watch table changes and update store (for external changes like chip removal)
watch(
  () => props.table?.tableApi?.getColumn('marketplace')?.getFilterValue(),
  (newFilterValue) => {
    if (tableFiltersStore.isUpdatingFromTable) return;

    const newValues = !newFilterValue
      ? []
      : Array.isArray(newFilterValue)
      ? newFilterValue
      : [newFilterValue];

    // Only update store if values are different
    const currentStoreValues = tableFiltersStore.marketplaceValues;
    if (
      JSON.stringify(currentStoreValues.sort()) !==
      JSON.stringify(newValues.sort())
    ) {
      tableFiltersStore.initializeFromMarketplaceValues(newValues);
    }
  }
);

watch(
  () => props.table?.tableApi?.getColumn('queries')?.getFilterValue(),
  (newFilterValue) => {
    if (tableFiltersStore.isUpdatingFromTable) return;

    const queryValue = typeof newFilterValue === 'string' ? newFilterValue : '';

    // Only update store if values are different
    if (tableFiltersStore.searchQuery !== queryValue) {
      tableFiltersStore.updateSearchQueryFromTable(queryValue);
    }
  }
);

function removeFilter(filter: {
  column: string;
  value: unknown;
  displayValue: string;
  label: string;
}) {
  if (filter.column === 'marketplace') {
    // Use store to remove marketplace
    tableFiltersStore.removeMarketplace(filter.value as string);
  } else if (filter.column === 'queries') {
    // Clear search query
    tableFiltersStore.clearSearchQuery();
  }
}
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
          :model-value="tableFiltersStore.searchQuery"
          class="max-w-sm min-w-[12ch]"
          placeholder="Search queries..."
          @update:model-value="tableFiltersStore.setSearchQuery($event)"
        />
      </div>

      <!-- Marketplace Filter -->
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400"
          >Marketplace</span
        >
        <USelectMenu
          :model-value="tableFiltersStore.selectedMarketplaces"
          :items="[
            { value: 'BLOCKET', label: 'Blocket' },
            { value: 'TRADERA', label: 'Tradera' },
          ]"
          multiple
          placeholder="Select marketplaces..."
          class="min-w-[15ch]"
          @update:model-value="tableFiltersStore.setMarketplaceFilter($event)"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex items-end gap-2 ml-auto">
        <UTooltip text="Refresh table" :delay-duration="250">
          <UButton
            :loading="refreshing"
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            aria-label="Refresh"
            @click="$emit('refresh')"
          />
        </UTooltip>

        <UTooltip text="Clear all filters" :delay-duration="250">
          <UButton
            icon="i-lucide-filter-x"
            variant="ghost"
            color="neutral"
            aria-label="Clear filters"
            @click="$emit('clearAllFilters')"
          />
        </UTooltip>

        <UDropdownMenu
          :items="table?.tableApi?.getAllColumns().filter((column: any) => column.getCanHide()).map((column: any) => ({
            label: column.id.charAt(0).toUpperCase() + column.id.slice(1).replace('_', ' '),
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
              @click="removeFilter(filter)"
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
