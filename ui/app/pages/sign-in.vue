<script lang="ts" setup>
import * as z from 'zod';

import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'sign-in',
});

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({
    title: 'Success',
    description: 'The form has been submitted.',
    color: 'success',
  });
  console.log(event.data);
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
      <UFormField label="Email" name="email">
        <UInput v-model="state.email" class="w-full" />
      </UFormField>

      <UFormField label="Password" name="password">
        <UInput v-model="state.password" class="w-full" type="password" />
      </UFormField>

      <UButton type="submit"> Submit </UButton>
    </UForm>
  </div>
</template>
