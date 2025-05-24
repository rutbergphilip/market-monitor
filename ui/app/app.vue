<script setup lang="ts">
const authStore = useAuthStore();
const router = useRouter();

const { token, isAuthenticated } = storeToRefs(authStore);

let refreshInterval: NodeJS.Timeout | null = null;

onMounted(async () => {
  if (token.value) {
    // Check and refresh token if needed
    const tokenValid = await authStore.checkAndRefreshToken();

    if (tokenValid) {
      await authStore.fetchCurrentUser();
    }
  }

  if (!isAuthenticated.value) {
    router.push('/sign-in');
  }

  // Set up automatic token refresh check every 5 minutes (client-side only)
  refreshInterval = setInterval(async () => {
    if (isAuthenticated.value) {
      await authStore.checkAndRefreshToken();
    }
  }, 5 * 60 * 1000); // 5 minutes
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
