export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  const data = await $fetch<Watcher>(`/api/watchers/${id}`, {
    method: 'DELETE',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${event.context.token}`,
    },
  });

  return data;
});
