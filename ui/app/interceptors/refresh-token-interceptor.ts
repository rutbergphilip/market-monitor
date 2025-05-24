import type { FetchResponse, ResolvedFetchOptions, ResponseType } from 'ofetch';

type RefreshTokenInterceptorOptions = {
  response: FetchResponse<unknown>;
  request: RequestInfo;
  error: Error | undefined;
  options: ResolvedFetchOptions<ResponseType, unknown>;
};

// Track ongoing refresh to prevent race conditions
let refreshPromise: Promise<boolean> | null = null;

export default async function refreshTokenInterceptor({
  response,
  options,
}: RefreshTokenInterceptorOptions) {
  if (response.status === 401) {
    const auth = useAuthStore();

    // Prevent multiple simultaneous refresh attempts
    if (!refreshPromise) {
      refreshPromise = auth.refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;

    if (refreshed && auth.token) {
      // Update the request headers with new token and retry
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.set('Authorization', `Bearer ${auth.token}`);
        } else {
          (options.headers as Record<string, string>).Authorization = `Bearer ${auth.token}`;
        }
      }

      // Return a new fetch promise with updated headers
      try {
        // Convert Headers to object if needed
        const headersObj = options.headers instanceof Headers 
          ? Object.fromEntries(options.headers.entries())
          : options.headers;

        const retryResponse = await $fetch(response.url, {
          method: (options.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') || 'GET',
          body: options.body,
          headers: {
            ...headersObj,
            Authorization: `Bearer ${auth.token}`,
          },
        });

        // Replace the response with the retry response
        Object.assign(response, {
          _data: retryResponse,
          status: 200,
          ok: true,
        });
      } catch (error) {
        console.error('Token refresh retry failed:', error);
      }
    } else {
      // Refresh failed, redirect to login
      await navigateTo('/sign-in');
    }
  }
}
