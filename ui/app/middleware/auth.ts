export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  // Skip middleware for sign-in page
  if (to.path === '/sign-in') {
    return;
  }

  // If user is not authenticated, redirect to sign-in
  if (!authStore.isAuthenticated) {
    return navigateTo('/sign-in');
  }
});
