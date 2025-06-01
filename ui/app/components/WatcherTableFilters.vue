<script setup lang="ts">
import { MARKETPLACE_LABELS } from '~/constants';

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

const selectedMarketplaces = ref<
  {
    value: string;
    label: string;
  }[]
>([]);

onMounted(() => {
  const currentFilter = props.table?.tableApi
    ?.getColumn('marketplace')
    ?.getFilterValue();
  if (Array.isArray(currentFilter)) {
    selectedMarketplaces.value = currentFilter.map((value) => ({
      value: value,
      label: MARKETPLACE_LABELS[value] || value,
    }));
  } else if (currentFilter && typeof currentFilter === 'string') {
    selectedMarketplaces.value = [
      {
        value: currentFilter,
        label: MARKETPLACE_LABELS[currentFilter] || currentFilter,
      },
    ];
  }
});

watch(
  selectedMarketplaces,
  (newValue) => {
    if (!props.table?.tableApi) return;

    if (!newValue.length) {
      props.table.tableApi.getColumn('marketplace')?.setFilterValue(undefined);
    } else {
      const marketplaceValues = newValue.map((item) => item.value);
      props.table.tableApi
        .getColumn('marketplace')
        ?.setFilterValue(marketplaceValues);
    }
  },
  { deep: true }
);
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
        <USelectMenu
          v-model="selectedMarketplaces"
          :items="[
            { value: 'BLOCKET', label: 'Blocket' },
            { value: 'TRADERA', label: 'Tradera' },
          ]"
          multiple
          placeholder="Select marketplaces..."
          class="min-w-[15ch]"
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
