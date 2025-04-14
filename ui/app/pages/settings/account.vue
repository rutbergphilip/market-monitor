<script lang="ts" setup>
import ProfileInformation from '~/components/settings/account/ProfileInformation.vue';
import SecuritySettings from '~/components/settings/account/SecuritySettings.vue';

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

const profileRef = ref<ProfileRef | null>(null);
const securityRef = ref<SecurityRef | null>(null);

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
    settingsStore.settings.forEach((setting) => {
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
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="max-w-4xl mx-auto">
      <header class="mb-8">
        <h1 class="text-2xl font-bold">Account Settings</h1>
        <p class="text-neutral-500 mt-2">
          Manage your account information and preferences
        </p>
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
      </div>
    </div>
  </div>
</template>
