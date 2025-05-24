export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<User | null>(null);
    const token = ref<string | null | undefined>(useCookie('auth_token').value);
    const refreshToken = ref<string | null | undefined>(
      useCookie('refresh_token').value
    );
    const loading = ref(false);
    const error = ref<string | null>(null);

    const isAuthenticated = computed(() => !!token.value);
    const isAdmin = computed(() => user.value?.role === 'admin');
    const userName = computed(() => user.value?.username || '');

    async function refreshAccessToken() {
      if (!refreshToken.value) {
        await clearAuthData();
        return false;
      }

      try {
        const { data, error: fetchError } = await useFetch(
          '/api/auth/refresh-token',
          {
            method: 'POST',
            body: { refreshToken: refreshToken.value },
            credentials: 'include',
          }
        );

        if (fetchError.value || !data.value) {
          console.warn('Token refresh failed:', fetchError.value?.data?.error);
          await clearAuthData();
          return false;
        }

        const response = data.value;

        // Update tokens atomically
        await updateTokens(response.token, response.refreshToken);

        return true;
      } catch (err) {
        console.error('Token refresh error:', err);
        await clearAuthData();
        return false;
      }
    }

    async function clearAuthData() {
      user.value = null;
      token.value = null;
      refreshToken.value = null;

      // Clear cookies as well
      const authCookie = useCookie('auth_token');
      const refreshCookie = useCookie('refresh_token');
      authCookie.value = null;
      refreshCookie.value = null;
    }

    async function updateTokens(newToken: string, newRefreshToken: string) {
      token.value = newToken;
      refreshToken.value = newRefreshToken;

      // Update cookies to keep them in sync
      const authCookie = useCookie('auth_token');
      const refreshCookie = useCookie('refresh_token');
      authCookie.value = newToken;
      refreshCookie.value = newRefreshToken;
    }

    async function login(username: string, password: string) {
      loading.value = true;
      error.value = null;

      try {
        const { data, error: fetchError } = await useFetch('/api/auth/login', {
          method: 'POST',
          body: { username, password },
          credentials: 'include',
        });

        if (fetchError.value) {
          const errorData = fetchError.value.data?.data;
          error.value =
            errorData?.error || 'Failed to login. Please try again.';
          return false;
        }

        if (!data.value) {
          error.value = 'No data received from server';
          return false;
        }

        const response = data.value;
        user.value = response.user;
        await updateTokens(response.token, response.refreshToken);

        return true;
      } catch (err) {
        console.error('Login error:', err);
        error.value = 'An unexpected error occurred';
        return false;
      } finally {
        loading.value = false;
      }
    }

    async function register(
      username: string,
      password: string,
      email?: string
    ) {
      loading.value = true;
      error.value = null;

      try {
        const { data, error: fetchError } = await useFetch(
          '/api/auth/register',
          {
            method: 'POST',
            body: { username, password, email },
            credentials: 'include',
          }
        );

        if (fetchError.value) {
          const errorData = fetchError.value.data?.data;
          error.value =
            errorData?.error || 'Failed to register. Please try again.';
          return false;
        }

        if (!data.value) {
          error.value = 'No data received from server';
          return false;
        }

        const response = data.value;
        user.value = response.user;
        await updateTokens(response.token, response.refreshToken);

        return true;
      } catch (err) {
        console.error('Registration error:', err);
        error.value = 'An unexpected error occurred';
        return false;
      } finally {
        loading.value = false;
      }
    }

    async function logout() {
      loading.value = true;
      error.value = null;

      try {
        await useFetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        });

        await clearAuthData();
        return true;
      } catch (err) {
        console.error('Logout error:', err);
        // Clear data even if request fails
        await clearAuthData();
        return false;
      } finally {
        loading.value = false;
      }
    }

    async function fetchCurrentUser() {
      if (!token.value) return false;

      loading.value = true;
      error.value = null;

      try {
        const { data, error: fetchError } = await useFetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        });

        if (fetchError.value) {
          if (fetchError.value.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
              return fetchCurrentUser();
            }
          }
          return false;
        }

        if (data.value) {
          user.value = data.value;
          return true;
        }

        return false;
      } catch (err) {
        console.error('Fetch user error:', err);
        return false;
      } finally {
        loading.value = false;
      }
    }

    async function updateProfile({
      username,
      email,
      avatarUrl,
    }: {
      username?: string;
      email?: string;
      avatarUrl?: string;
    }) {
      if (!token.value || !user.value) return false;

      loading.value = true;
      error.value = null;

      try {
        const { data, error: fetchError } = await useFetch(
          '/api/auth/profile',
          {
            method: 'PATCH',
            body: {
              username: username !== undefined ? username : user.value.username,
              email: email !== undefined ? email : user.value.email,
              avatarUrl,
            },
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token.value}`,
            },
          }
        );

        if (fetchError.value) {
          if (fetchError.value.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
              return updateProfile({ username, email, avatarUrl });
            }
          }

          error.value =
            fetchError.value.data?.error || 'Failed to update profile';
          return false;
        }

        if (data.value) {
          user.value = data.value;
          return true;
        }

        return false;
      } catch (err) {
        console.error('Update profile error:', err);
        error.value = 'An unexpected error occurred';
        return false;
      } finally {
        loading.value = false;
      }
    }

    function setToken(newToken: string) {
      token.value = newToken;
    }

    function setRefreshToken(newRefreshToken: string) {
      refreshToken.value = newRefreshToken;
    }

    async function fetchWithAuth<T>(
      url: string,
      options: Record<string, unknown>
    ) {
      if (!token.value) {
        throw new Error('No authentication token available');
      }

      const authOptions = {
        ...options,
        headers: {
          ...((options.headers as Record<string, unknown>) || {}),
          Authorization: `Bearer ${token.value}`,
        },
        credentials: 'include' as const,
      };

      let result = await useFetch<T>(url, authOptions);

      // If we get a 401, try to refresh the token once and retry
      if (result.error.value?.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed && token.value) {
          // Update auth header with new token and retry
          authOptions.headers.Authorization = `Bearer ${token.value}`;
          result = await useFetch<T>(url, authOptions);
        } else {
          // Refresh failed, redirect to login
          await navigateTo('/sign-in');
          throw new Error('Authentication failed');
        }
      }

      return result;
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    function isTokenExpired(token: string): boolean {
      try {
        const parts = token.split('.');
        if (parts.length !== 3 || !parts[1]) return true;

        const payload = JSON.parse(atob(parts[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        return expirationTime - currentTime < fiveMinutes;
      } catch (error) {
        console.error('Error checking token expiration:', error);
        return true; // Assume expired if we can't parse it
      }
    }

    // Proactively refresh token if it's about to expire
    async function checkAndRefreshToken(): Promise<boolean> {
      if (!token.value) return false;

      if (isTokenExpired(token.value)) {
        return await refreshAccessToken();
      }

      return true;
    }

    return {
      user,
      token,
      refreshToken,
      loading,
      error,
      isAuthenticated,
      isAdmin,
      userName,
      login,
      register,
      logout,
      fetchCurrentUser,
      updateProfile,
      setToken,
      setRefreshToken,
      refreshAccessToken,
      fetchWithAuth,
      checkAndRefreshToken,
    };
  },
  {
    persist: {
      storage: piniaPluginPersistedstate.localStorage(),
    },
  }
);
