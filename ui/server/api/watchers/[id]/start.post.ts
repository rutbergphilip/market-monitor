export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  const data = await $fetch<Watcher>(`/api/watchers/${id}/start`, {
    method: 'POST',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${event.context.token}`,
    },
  });

  return data;
});
