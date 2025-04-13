export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const data = await $fetch<Watcher>('/api/watchers', {
    method: 'POST',
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${event.context.token}`,
    },
    body,
  });

  return data;
});
