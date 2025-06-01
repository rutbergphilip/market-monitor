import { defineStore } from 'pinia';
import { MARKETPLACE_LABELS } from '~/constants';

interface MarketplaceFilter {
  value: string;
  label: string;
}

export const useTableFiltersStore = defineStore('tableFilters', () => {
  // State
  const selectedMarketplaces = ref<MarketplaceFilter[]>([]);
  const searchQuery = ref('');

  // Internal flag to prevent recursive updates
  const isUpdatingFromTable = ref(false);

  // Actions
  function setMarketplaceFilter(marketplaces: MarketplaceFilter[]) {
    selectedMarketplaces.value = marketplaces;
  }

  function addMarketplace(marketplace: MarketplaceFilter) {
    if (
      !selectedMarketplaces.value.find((m) => m.value === marketplace.value)
    ) {
      selectedMarketplaces.value.push(marketplace);
    }
  }

  function removeMarketplace(marketplaceValue: string) {
    selectedMarketplaces.value = selectedMarketplaces.value.filter(
      (m) => m.value !== marketplaceValue
    );
  }

  function clearMarketplaceFilter() {
    selectedMarketplaces.value = [];
  }

  function setSearchQuery(query: string | number) {
    searchQuery.value = String(query || '');
  }

  function clearSearchQuery() {
    searchQuery.value = '';
  }

  function clearAllFilters() {
    selectedMarketplaces.value = [];
    searchQuery.value = '';
  }

  // Getters
  const marketplaceValues = computed(() =>
    selectedMarketplaces.value.map((m) => m.value)
  );

  const hasMarketplaceFilter = computed(
    () => selectedMarketplaces.value.length > 0
  );

  const hasSearchQuery = computed(() => searchQuery.value.trim() !== '');

  const hasAnyFilter = computed(
    () => hasMarketplaceFilter.value || hasSearchQuery.value
  );

  // Initialize from marketplace values (for external updates)
  function initializeFromMarketplaceValues(values: string[]) {
    // Prevent updates if values are the same
    const currentValues = marketplaceValues.value;
    if (
      JSON.stringify(currentValues.sort()) === JSON.stringify(values.sort())
    ) {
      return;
    }

    isUpdatingFromTable.value = true;
    selectedMarketplaces.value = values.map((value) => ({
      value,
      label: MARKETPLACE_LABELS[value] || value,
    }));
    nextTick(() => {
      isUpdatingFromTable.value = false;
    });
  }

  // Update search query from table (for external updates)
  function updateSearchQueryFromTable(query: string) {
    // Prevent updates if values are the same
    if (searchQuery.value === query) {
      return;
    }

    isUpdatingFromTable.value = true;
    searchQuery.value = query;
    nextTick(() => {
      isUpdatingFromTable.value = false;
    });
  }

  return {
    // State (for v-model compatibility, expose raw refs)
    selectedMarketplaces,
    searchQuery,

    // Actions
    setMarketplaceFilter,
    addMarketplace,
    removeMarketplace,
    clearMarketplaceFilter,
    setSearchQuery,
    clearSearchQuery,
    clearAllFilters,
    initializeFromMarketplaceValues,
    updateSearchQueryFromTable,

    // Internal state
    isUpdatingFromTable: readonly(isUpdatingFromTable),

    // Getters
    marketplaceValues,
    hasMarketplaceFilter,
    hasSearchQuery,
    hasAnyFilter,
  };
});
