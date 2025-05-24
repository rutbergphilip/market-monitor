<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  variant?: 'compact' | 'full';
}

withDefaults(defineProps<Props>(), {
  size: 'lg',
  showName: false,
  variant: 'compact',
});

const authStore = useAuthStore();
const router = useRouter();

const userName = computed(() => authStore.user?.username || 'User');
const userInitial = computed(() =>
  (userName.value.charAt(0) || 'U').toUpperCase()
);

const items: DropdownMenuItem[] | DropdownMenuItem[][] = [
  [
    {
      label: userName.value,
      slot: 'account',
      disabled: true,
    },
  ],
  [
    {
      label: 'Theme',
      slot: 'theme',
      disabled: true,
    },
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      slot: 'sign-out',
      disabled: true,
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
      v-if="variant === 'compact'"
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
        :size="size"
        class="ring-2 ring-gray-200 hover:ring-primary-400 hover:shadow-lg hover:scale-105 group-hover:ring-primary-500 transition-all duration-300 ease-out transform"
      />
    </UButton>

    <!-- Full variant (avatar + name) -->
    <UButton
      v-else
      variant="ghost"
      color="neutral"
      :padded="true"
      class="!bg-transparent hover:!bg-gray-100 dark:hover:!bg-gray-800 focus:!bg-transparent group justify-start w-full"
      aria-label="User menu"
    >
      <div class="flex items-center space-x-3">
        <UAvatar
          :src="authStore.user?.avatarUrl"
          :alt="userName"
          :text="userInitial"
          :size="size"
          class="ring-2 ring-gray-200 group-hover:ring-primary-400 transition-all duration-300 ease-out"
        />
        <div v-if="showName || variant === 'full'" class="text-left">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ userName }}
          </p>
          <p
            v-if="authStore.user?.email"
            class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]"
          >
            {{ authStore.user.email }}
          </p>
        </div>
      </div>
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

    <template #theme>
      <ColorModeToggle />
    </template>

    <template #sign-out>
      <UButton
        variant="ghost"
        color="neutral"
        class="w-full justify-start"
        @click="handleSignOut"
      >
        <UIcon name="i-heroicons-arrow-right-on-rectangle" />
        <span class="ml-2">Sign out</span>
      </UButton>
    </template>
  </UDropdownMenu>
</template>
