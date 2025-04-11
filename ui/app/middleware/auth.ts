export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  if (to.path === '/sign-in') {
    return;
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/sign-in');
  }
});
