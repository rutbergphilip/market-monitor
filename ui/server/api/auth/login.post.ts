export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event);

  const data = await $fetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
  });

  return data;
});
