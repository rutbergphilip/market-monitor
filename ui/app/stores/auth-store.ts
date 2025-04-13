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
        user.value = null;
        token.value = null;
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
          user.value = null;
          token.value = null;
          refreshToken.value = null;
          return false;
        }

        const response = data.value;
        token.value = response.token;
        refreshToken.value = response.refreshToken;

        return true;
      } catch (err) {
        console.error('Token refresh error:', err);
        user.value = null;
        token.value = null;
        refreshToken.value = null;
        return false;
      }
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
        token.value = response.token;
        refreshToken.value = response.refreshToken;

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
        token.value = response.token;
        refreshToken.value = response.refreshToken;

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

        user.value = null;
        token.value = null;
        refreshToken.value = null;

        return true;
      } catch (err) {
        console.error('Logout error:', err);
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
      };

      let result = await useFetch<T>(url, authOptions);

      if (result.error.value?.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          authOptions.headers.Authorization = `Bearer ${token.value}`;
          result = await useFetch<T>(url, authOptions);
        }
      }

      return result;
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
    };
  },
  {
    persist: {
      storage: piniaPluginPersistedstate.localStorage(),
    },
  }
);
