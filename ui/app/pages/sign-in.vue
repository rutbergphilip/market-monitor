<script lang="ts" setup>
import * as z from 'zod';

import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'sign-in',
  auth: false,
});

const authStore = useAuthStore();
const router = useRouter();

// If user is already authenticated, redirect to dashboard
onMounted(async () => {
  await nextTick();
  if (authStore.isAuthenticated) {
    router.push('/');
  }
});

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string(),
});

type Schema = z.output<typeof schema>;

// Pre-populate with default admin credentials
const state = reactive<Partial<Schema>>({
  username: '',
  password: '',
});

const toast = useToast();
const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const success = await authStore.login(
      event.data.username,
      event.data.password
    );

    if (success) {
      toast.add({
        title: 'Success',
        description: 'You have been signed in successfully',
        color: 'success',
      });

      // Redirect to dashboard
      router.push('/');
    } else {
      toast.add({
        title: 'Error',
        description: authStore.error || 'Failed to sign in. Please try again.',
        color: 'error',
      });
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'An unexpected error occurred',
      color: 'error',
    });
    console.error('Error during sign-in:', error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-2 justify-center items-center mx-auto mt-20 max-w-80"
  >
    <div class="flex flex-col gap-4 items-center">
      <UIcon class="scale-200" name="lucide:user" />
      <h1 class="text-3xl font-bold">Sign in</h1>
      <p class="text-lg">Enter your credentials to your account.</p>
      <USeparator />
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4 w-full"
      @submit="onSubmit"
    >
      <UFormField label="Username" name="username">
        <UInput v-model="state.username" class="w-full" />
      </UFormField>

      <UFormField label="Password" name="password">
        <UInput v-model="state.password" class="w-full" type="password" />
      </UFormField>

      <UButton
        type="submit"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        block
      >
        Sign In
      </UButton>
    </UForm>
  </div>
</template>
