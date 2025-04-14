<script setup lang="ts">
defineEmits({
  close: (response: boolean) => typeof response === 'boolean',
});
defineProps({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  confirmButtonText: {
    type: String,
    default: 'Confirm',
  },
  cancelButtonText: {
    type: String,
    default: 'Cancel',
  },
  confirmButtonColor: {
    type: String as PropType<
      | 'success'
      | 'primary'
      | 'secondary'
      | 'info'
      | 'warning'
      | 'error'
      | 'neutral'
      | undefined
    >,
    default: 'primary',
    required: false,
  },
});
</script>

<template>
  <UModal :close="{ onClick: () => $emit('close', false) }">
    <template #header>
      <h3 class="text-lg font-medium">{{ title }}</h3>
    </template>

    <template #body>
      <p class="text-neutral-300">{{ message }}</p>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton color="neutral" @click="$emit('close', false)">
          {{ cancelButtonText }}
        </UButton>
        <UButton :color="confirmButtonColor" @click="$emit('close', true)">
          {{ confirmButtonText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
