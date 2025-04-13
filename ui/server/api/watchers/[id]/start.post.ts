export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  const authHeader = event.node.req.headers.authorization;
  const token = authHeader?.split(' ')?.[1];

  const data = await $fetch<Watcher>(`/api/watchers/${id}/start`, {
    method: 'POST',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
});
