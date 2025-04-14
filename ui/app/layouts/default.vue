<script setup lang="ts">
const sidebarCollapsed = inject('sidebarCollapsed', ref(false));
const isMobileMenuOpen = ref(false);
const isMobile = ref(false);

const { width } = useWindowSize();

watchEffect(() => {
  isMobile.value = width.value < 1200;
});

function openMobileMenu() {
  isMobileMenuOpen.value = true;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}
</script>

<template>
  <!-- Mobile Layout -->
  <div v-if="isMobile" class="flex flex-col h-full">
    <MobileTopbar :open-sidebar="openMobileMenu" />
    <MobileSidebar :is-open="isMobileMenuOpen" :on-close="closeMobileMenu" />
    <div class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <slot />
      </div>
    </div>
  </div>

  <!-- Desktop Layout -->
  <div v-else class="flex">
    <Sidebar class="flex-shrink-0" />
    <div
      class="flex-1 transition-all duration-200"
      :class="{ 'ml-16': sidebarCollapsed, 'ml-60': !sidebarCollapsed }"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <slot />
      </div>
    </div>
  </div>
</template>
