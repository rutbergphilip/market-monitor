export const useStatesStore = defineStore(
  'states',
  () => {
    const sidebarOpen = ref(false);
    const sidebarCollapsed = ref(false);

    const openSidebar = () => {
      sidebarOpen.value = true;
    };
    const closeSidebar = () => {
      sidebarOpen.value = false;
    };

    const toggleSidebarCollapsed = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    };

    const setSidebarCollapsed = (value: boolean) => {
      sidebarCollapsed.value = value;
    };

    return {
      sidebarOpen,
      sidebarCollapsed,
      openSidebar,
      closeSidebar,
      toggleSidebarCollapsed,
      setSidebarCollapsed,
    };
  },
  {
    persist: {
      storage: piniaPluginPersistedstate.localStorage(),
      pick: ['sidebarCollapsed'],
    },
  }
);
