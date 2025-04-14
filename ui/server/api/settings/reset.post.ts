export default defineEventHandler(async (event) => {
  const data = await $fetch<Setting>('/api/settings/reset', {
    method: 'PATCH',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${event.context.token}`,
    },
  });

  return data;
});
