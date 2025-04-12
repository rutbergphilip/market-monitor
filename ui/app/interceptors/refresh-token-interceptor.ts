import type { FetchResponse, ResolvedFetchOptions, ResponseType } from 'ofetch';

type RefreshTokenInterceptorOptions = {
  response: FetchResponse<unknown>;
  request: RequestInfo;
  error: Error | undefined;
  options: ResolvedFetchOptions<ResponseType, unknown>;
};

export default async function refreshTokenInterceptor({
  response,
}: RefreshTokenInterceptorOptions) {
  if (response.status === 401) {
    const auth = useAuthStore();
    await auth.refreshAccessToken();
  }
}
