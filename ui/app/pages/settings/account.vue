<script lang="ts" setup>
import ProfileInformation from '~/components/settings/account/ProfileInformation.vue';
import SecuritySettings from '~/components/settings/account/SecuritySettings.vue';

definePageMeta({
  layout: 'default',
});

type ProfileRef = {
  profileState: {
    displayName: string;
    email: string;
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

const _isLoading = ref(false);
const isSaving = ref(false);

function saveProfileInformation() {
  isSaving.value = true;

  setTimeout(() => {
    isSaving.value = false;
    useToast().add({
      title: 'Success',
      description: 'Profile information saved',
      color: 'success',
    });
  }, 1000);
}

function changePassword() {
  if (!securityRef.value) return;

  isSaving.value = true;

  const securityRefValue = securityRef.value;

  setTimeout(() => {
    isSaving.value = false;
    useToast().add({
      title: 'Success',
      description: 'Password changed successfully',
      color: 'success',
    });

    if (securityRefValue) {
      securityRefValue.securityState.currentPassword = '';
      securityRefValue.securityState.newPassword = '';
      securityRefValue.securityState.confirmPassword = '';
    }
  }, 1000);
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

      <div class="space-y-6">
        <ProfileInformation
          ref="profileRef"
          :is-saving="isSaving"
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
