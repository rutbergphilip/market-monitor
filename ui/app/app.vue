<script setup>
const authStore = useAuthStore();
const router = useRouter();

const { token, isAuthenticated } = storeToRefs(authStore);

onMounted(async () => {
  if (token.value) {
    await authStore.fetchCurrentUser();
  }

  if (!isAuthenticated.value) {
    router.push('/sign-in');
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
