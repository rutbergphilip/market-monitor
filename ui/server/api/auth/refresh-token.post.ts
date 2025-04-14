export default defineEventHandler(async (event) => {
  const { refreshToken } = await readBody(event);

  const data = await $fetch<TokenResponse>('/api/auth/refresh-token', {
    method: 'POST',
    body: { refreshToken },
    baseURL: useRuntimeConfig(event).apiBaseUrl,
    credentials: 'include',
  });

  return data;
});
