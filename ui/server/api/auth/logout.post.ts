export default defineEventHandler(async (event) => {
  const data = await $fetch<LoginResponse>('/api/auth/logout', {
    method: 'POST',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${event.context.token}`,
    },
  });

  return data;
});
