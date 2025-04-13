export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key');
  const body = await readBody(event);

  const data = await $fetch<Setting>(`/api/settings/${key}`, {
    method: 'PATCH',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${event.context.token}`,
    },
    body,
  });

  return data;
});
