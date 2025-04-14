export default defineEventHandler(async (event) => {
  const { username, password, email } = await readBody(event);

  const data = await $fetch<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: { username, password, email },
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
  });

  return data;
});
