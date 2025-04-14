<script lang="ts" setup>
const authStore = useAuthStore();
const router = useRouter();

const userName = computed(() => authStore.user?.username || 'User');
const userInitial = computed(() =>
  (userName.value.charAt(0) || 'U').toUpperCase()
);

async function handleSignOut() {
  await authStore.logout();
  router.push('/sign-in');
}
</script>

<template>
  <UPopover>
    <UAvatar
      :src="authStore.user?.avatarUrl"
      :alt="userName"
      :text="userInitial"
      size="lg"
      class="mr-2 hover:*:cursor-pointer ring-2 ring-gray-200 hover:ring-primary-300 transition-all duration-200 ease-in-out"
    />

    <template #content>
      <div class="p-4">
        <div class="ml-2">
          <p class="text-sm font-medium">{{ userName }}</p>
          <p
            v-if="authStore.user?.email"
            class="text-xs text-gray-500 truncate max-w-[100px]"
          >
            {{ authStore.user.email }}
          </p>
        </div>

        <div class="flex items-center justify-between mt-2">
          <UButton
            variant="link"
            icon="material-symbols:logout"
            title="Sign out"
            :ui="{
              leadingIcon: 'scale-125',
            }"
            @click="handleSignOut"
            >Sign out</UButton
          >
        </div>
      </div>
    </template>
  </UPopover>
</template>
