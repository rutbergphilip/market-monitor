export default defineEventHandler(async (event) => {
  const data = await $fetch<Watcher[]>('/api/watchers', {
    method: 'GET',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${event.context.token}`,
    },
  });

  return data;
});
