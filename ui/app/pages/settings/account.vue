<script lang="ts" setup>
import ProfileInformation from '~/components/settings/account/ProfileInformation.vue';
import SecuritySettings from '~/components/settings/account/SecuritySettings.vue';
import TokenSettings from '~/components/settings/account/TokenSettings.vue';
import type { Setting } from '../../../shared/types/settings';

definePageMeta({
  layout: 'default',
});

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const toast = useToast();

const { user } = storeToRefs(authStore);

type ProfileRef = {
  profileState: {
    username: string;
    email: string;
    avatarUrl: string;
  };
};

type SecurityRef = {
  securityState: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
};

type TokenRef = {
  tokenState: {
    tokenExpiry: string;
  };
};

const profileRef = ref<ProfileRef | null>(null);
const securityRef = ref<SecurityRef | null>(null);
const tokenRef = ref<TokenRef | null>(null);

const isLoading = ref(true);
const isSaving = ref(false);

const settingsMap = {
  'account.profile.username': (value: string) => {
    if (profileRef.value) profileRef.value.profileState.username = value;
  },
  'account.profile.email': (value: string) => {
    if (profileRef.value) profileRef.value.profileState.email = value;
  },
  'account.profile.avatarUrl': (value: string) => {
    if (profileRef.value) profileRef.value.profileState.avatarUrl = value;
  },
  'security.token.expiry': (value: string) => {
    if (tokenRef.value) tokenRef.value.tokenState.tokenExpiry = value;
  },
};

onMounted(async () => {
  await nextTick();
  await settingsStore.fetchSettings();

  // Initialize profile form with existing settings data if available,
  // falling back to user data from auth store when needed
  if (profileRef.value) {
    const username =
      settingsStore.getSettingValue('account.profile.username') ||
      user.value?.username ||
      '';
    const email =
      settingsStore.getSettingValue('account.profile.email') ||
      user.value?.email ||
      '';
    const avatarUrl =
      settingsStore.getSettingValue('account.profile.avatarUrl') ||
      user.value?.avatarUrl ||
      '';

    profileRef.value.profileState.username = username;
    profileRef.value.profileState.email = email;
    profileRef.value.profileState.avatarUrl = avatarUrl;
  }

  isLoading.value = false;
});

watch(
  () => settingsStore.settings,
  () => {
    settingsStore.settings.forEach((setting: Setting) => {
      const mapFn = settingsMap[setting.key as keyof typeof settingsMap];
      if (mapFn) {
        mapFn(setting.value);
      }
    });
  },
  { immediate: true }
);

async function updateSettings(
  settings: Array<{ key: string; value: string }>
): Promise<void> {
  for (const setting of settings) {
    await settingsStore.updateSetting(setting.key, setting.value);
  }
}

async function saveProfileInformation() {
  if (!profileRef.value) return;

  isSaving.value = true;
  try {
    // Get values from form
    const { username, email, avatarUrl } = profileRef.value.profileState;

    // Update settings first
    const profileSettings = [
      {
        key: 'account.profile.username',
        value: username,
      },
      {
        key: 'account.profile.email',
        value: email,
      },
      {
        key: 'account.profile.avatarUrl',
        value: avatarUrl,
      },
    ];

    await updateSettings(profileSettings);

    // Update user information in auth store
    const profileUpdateResult = await authStore.updateProfile({
      username,
      email,
      avatarUrl,
    });

    if (!profileUpdateResult) {
      throw new Error('Failed to update user profile');
    }

    toast.add({
      title: 'Success',
      description: 'Profile information saved',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save profile information',
      color: 'error',
    });
    console.error('Failed to save profile information:', error);
  } finally {
    isSaving.value = false;
  }
}

async function changePassword() {
  if (!securityRef.value) return;

  isSaving.value = true;

  const securityRefValue = securityRef.value;

  try {
    // Simulate password change API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.add({
      title: 'Success',
      description: 'Password changed successfully',
      color: 'success',
    });

    if (securityRefValue) {
      securityRefValue.securityState.currentPassword = '';
      securityRefValue.securityState.newPassword = '';
      securityRefValue.securityState.confirmPassword = '';
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to change password',
      color: 'error',
    });
    console.error('Failed to change password:', error);
  } finally {
    isSaving.value = false;
  }
}

async function saveTokenSettings() {
  if (!tokenRef.value) return;

  isSaving.value = true;
  try {
    const { tokenExpiry } = tokenRef.value.tokenState;

    const tokenSettings = [
      {
        key: 'security.token.expiry',
        value: tokenExpiry,
      },
    ];

    await updateSettings(tokenSettings);

    // Immediately rotate the current token to apply new expiry settings
    console.log('[Settings] Token expiry updated, rotating current token...');
    const tokenRotated = await authStore.refreshAccessToken();

    if (tokenRotated) {
      console.log(
        '[Settings] Token successfully rotated with new expiry settings'
      );
      toast.add({
        title: 'Success',
        description: 'Token settings saved and current session updated',
        color: 'success',
      });
    } else {
      console.warn('[Settings] Token rotation failed, but settings were saved');
      toast.add({
        title: 'Warning',
        description:
          'Token settings saved, but current session may need manual refresh',
        color: 'warning',
      });
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save token settings',
      color: 'error',
    });
    console.error('Failed to save token settings:', error);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="max-w-7xl mx-auto">
      <header class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">Account Settings</h1>
          <p class="text-neutral-500 mt-2">
            Manage your account information and preferences
          </p>
        </div>
      </header>

      <div v-if="isLoading" class="space-y-6">
        <USkeleton class="h-[500px] w-full" />
      </div>

      <div v-else class="space-y-6">
        <ProfileInformation
          ref="profileRef"
          :is-saving="isSaving"
          :settings="{
            email: settingsStore.getSettingValue('account.profile.email'),
            username: settingsStore.getSettingValue('account.profile.username'),
            avatarUrl:
              settingsStore.getSettingValue('account.profile.avatarUrl') ||
              user?.avatarUrl ||
              '',
          }"
          @save="saveProfileInformation"
        />

        <SecuritySettings
          ref="securityRef"
          :is-saving="isSaving"
          @save="changePassword"
        />

        <TokenSettings
          ref="tokenRef"
          :is-saving="isSaving"
          :settings="{
            tokenExpiry:
              settingsStore.getSettingValue('security.token.expiry') || '48h',
          }"
          @save="saveTokenSettings"
        />
      </div>
    </div>
  </div>
</template>
