export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const authHeader = event.node.req.headers.authorization;
  const token = authHeader?.split(' ')?.[1];

  const data = await $fetch<Watcher>('/api/watchers', {
    method: 'POST',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  return data;
});
