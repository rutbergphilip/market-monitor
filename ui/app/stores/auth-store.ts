export interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  avatarUrl?: string;
  created_at: string;
  updated_at: string;
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<User | null>(null);
    const token = ref<string | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Getters
    const isAuthenticated = computed(() => !!token.value);
    const isAdmin = computed(() => user.value?.role === 'admin');
    const userName = computed(() => user.value?.username || '');

    // Actions
    async function login(username: string, password: string) {
      loading.value = true;
      error.value = null;

      try {
        const { data, error: fetchError } = await useFetch('/api/auth/login', {
          method: 'POST',
          baseURL: useRuntimeConfig().public.apiBaseUrl,
          body: { username, password },
          credentials: 'include',
        });

        if (fetchError.value) {
          const errorData = fetchError.value.data;
          error.value =
            errorData?.error || 'Failed to login. Please try again.';
          return false;
        }

        if (!data.value) {
          error.value = 'No data received from server';
          return false;
        }

        const response = data.value as { user: User; token: string };
        user.value = response.user;
        token.value = response.token;

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
            baseURL: useRuntimeConfig().public.apiBaseUrl,
            body: { username, password, email },
            credentials: 'include',
          }
        );

        if (fetchError.value) {
          const errorData = fetchError.value.data;
          error.value =
            errorData?.error || 'Failed to register. Please try again.';
          return false;
        }

        if (!data.value) {
          error.value = 'No data received from server';
          return false;
        }

        const response = data.value as { user: User; token: string };
        user.value = response.user;
        token.value = response.token;

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
          baseURL: useRuntimeConfig().public.apiBaseUrl,
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        });

        // Clear user data regardless of server response
        user.value = null;
        token.value = null;

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
          baseURL: useRuntimeConfig().public.apiBaseUrl,
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        });

        if (fetchError.value) {
          // Clear user if unauthorized
          if (fetchError.value.status === 401) {
            user.value = null;
            token.value = null;
          }
          return false;
        }

        if (data.value) {
          user.value = data.value as User;
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
            baseURL: useRuntimeConfig().public.apiBaseUrl,
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
          error.value =
            fetchError.value.data?.error || 'Failed to update profile';
          return false;
        }

        if (data.value) {
          user.value = data.value as User;
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

    return {
      // State
      user,
      token,
      loading,
      error,

      // Getters
      isAuthenticated,
      isAdmin,
      userName,

      // Actions
      login,
      register,
      logout,
      fetchCurrentUser,
      updateProfile,
      setToken,
    };
  },
  {
    persist: {
      storage: piniaPluginPersistedstate.localStorage(),
    },
  }
);
