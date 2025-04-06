<script lang="ts" setup>
const authStore = useAuthStore();
const router = useRouter();

const userName = computed(() => authStore.user?.username || 'User');
// First character of username for avatar fallback
const userInitial = computed(() =>
  (userName.value.charAt(0) || 'U').toUpperCase()
);

async function handleSignOut() {
  await authStore.logout();
  router.push('/sign-in');
}
</script>

<template>
  <div class="user-component py-2 mt-auto">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <UAvatar
          :src="authStore.user?.avatarUrl"
          :alt="userName"
          :text="userInitial"
          size="sm"
          class="mr-2"
        />
        <div class="ml-2">
          <p class="text-sm font-medium">{{ userName }}</p>
          <p
            v-if="authStore.user?.email"
            class="text-xs text-gray-500 truncate max-w-[100px]"
          >
            {{ authStore.user.email }}
          </p>
        </div>
      </div>

      <UTooltip text="Sign out" :delay-duration="250">
        <UButton
          variant="link"
          icon="material-symbols:logout"
          size="xl"
          title="Sign out"
          :ui="{
            leadingIcon: 'scale-125',
          }"
          @click="handleSignOut"
        />
      </UTooltip>
    </div>
  </div>
</template>

<style scoped>
.user-component {
  background-color: var(--color-background-soft, rgba(0, 0, 0, 0.02));
}
</style>
