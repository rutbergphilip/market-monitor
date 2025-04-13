export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key');
  const body = await readBody(event);

  const authHeader = event.node.req.headers.authorization;
  const token = authHeader?.split(' ')?.[1];

  const data = await $fetch<Setting>(`/api/settings/${key}`, {
    method: 'PATCH',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  return data;
});
