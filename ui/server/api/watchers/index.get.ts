export default defineEventHandler(async (event) => {
  const authHeader = event.node.req.headers.authorization;
  const token = authHeader?.split(' ')?.[1];

  const data = await $fetch<Watcher[]>('/api/watchers', {
    method: 'GET',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
});
