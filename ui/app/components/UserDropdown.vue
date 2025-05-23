<script lang="ts" setup>
const authStore = useAuthStore();
const router = useRouter();

const userName = computed(() => authStore.user?.username || 'User');
const userInitial = computed(() =>
  (userName.value.charAt(0) || 'U').toUpperCase()
);

const items = [
  [
    {
      label: userName.value,
      slot: 'account',
      disabled: true,
    },
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      click: handleSignOut,
    },
  ],
];

async function handleSignOut() {
  await authStore.logout();
  router.push('/sign-in');
}
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      variant="ghost"
      color="neutral"
      :padded="false"
      class="!p-0 !bg-transparent hover:!bg-transparent focus:!bg-transparent group"
      aria-label="User menu"
    >
      <UAvatar
        :src="authStore.user?.avatarUrl"
        :alt="userName"
        :text="userInitial"
        size="lg"
        class="ring-2 ring-gray-200 hover:ring-primary-400 hover:shadow-lg hover:scale-105 group-hover:ring-primary-500 transition-all duration-300 ease-out transform"
      />
    </UButton>

    <template #account>
      <div class="text-left">
        <p class="font-medium text-gray-900 dark:text-white">
          {{ userName }}
        </p>
        <p
          v-if="authStore.user?.email"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          {{ authStore.user.email }}
        </p>
      </div>
    </template>
  </UDropdownMenu>
</template>
