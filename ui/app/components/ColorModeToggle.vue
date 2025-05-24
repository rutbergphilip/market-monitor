<script setup lang="ts">
const colorMode = useColorMode();

const isDark = computed({
  get() {
    return colorMode.value === 'dark';
  },
  set(isDarkValue: boolean) {
    colorMode.preference = isDarkValue ? 'dark' : 'light';
  },
});
</script>

<template>
  <ClientOnly v-if="!colorMode?.forced">
    <UButton
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      variant="ghost"
      color="neutral"
      block
      :aria-label="isDark ? 'Dark' : 'Light'"
      @click="isDark = !isDark"
    >
      {{ isDark ? 'Dark' : 'Light' }}
    </UButton>

    <template #fallback>
      <div class="size-8" />
    </template>
  </ClientOnly>
</template>
