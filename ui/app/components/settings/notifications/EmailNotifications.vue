<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  save: [];
}>();

const emailSchema = z.object({
  enabled: z.boolean(),
  from: z.string().email('Invalid email').or(z.string().length(0)),
  to: z.string().email('Invalid email').or(z.string().length(0)),
  subject: z.string(),
  smtpHost: z.string(),
  smtpPort: z.number().int().min(1, 'Min 1').max(65535, 'Max 65535'),
  smtpUser: z.string(),
  smtpPass: z.string(),
  useTLS: z.boolean(),
});

const emailState = reactive({
  enabled: false,
  from: '',
  to: '',
  subject: 'New Blocket listings found',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  useTLS: true,
});

defineExpose({
  emailState,
});

function saveEmailSettings() {
  emit('save');
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center">
        <UIcon name="material-symbols:mail" class="mr-2 text-xl" />
        <h2 class="text-lg font-semibold">Email Notifications</h2>
        <UBadge class="ml-2" color="neutral">Upcoming Feature</UBadge>
      </div>
    </template>

    <!-- Upcoming Feature -->
    <UForm
      v-if="false"
      :schema="emailSchema"
      :state="emailState"
      class="space-y-4"
      @submit="saveEmailSettings"
    >
      <div class="flex items-center space-x-2 mb-4">
        <UCheckbox
          id="email-enabled"
          v-model="emailState.enabled"
          name="enabled"
          disabled
        />
        <label for="email-enabled" class="font-medium"
          >Enable Email Notifications</label
        >
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div class="mb-1">
            <label for="email-from" class="block font-medium text-sm"
              >From Email</label
            >
          </div>
          <UInput
            id="email-from"
            v-model="emailState.from"
            placeholder="sender@example.com"
            disabled
          />
          <p class="text-xs text-neutral-500 mt-1">Sender email address</p>
        </div>

        <div>
          <div class="mb-1">
            <label for="email-to" class="block font-medium text-sm"
              >To Email</label
            >
          </div>
          <UInput
            id="email-to"
            v-model="emailState.to"
            placeholder="recipient@example.com"
            disabled
          />
          <p class="text-xs text-neutral-500 mt-1">Recipient email address</p>
        </div>

        <div class="md:col-span-2">
          <div class="mb-1">
            <label for="email-subject" class="block font-medium text-sm"
              >Email Subject</label
            >
          </div>
          <UInput
            id="email-subject"
            v-model="emailState.subject"
            placeholder="New Blocket Listings"
            disabled
          />
          <p class="text-xs text-neutral-500 mt-1">
            Subject line for notification emails
          </p>
        </div>

        <div>
          <div class="mb-1">
            <label for="smtp-host" class="block font-medium text-sm"
              >SMTP Host</label
            >
          </div>
          <UInput
            id="smtp-host"
            v-model="emailState.smtpHost"
            placeholder="smtp.example.com"
            disabled
          />
          <p class="text-xs text-neutral-500 mt-1">SMTP server address</p>
        </div>

        <div>
          <div class="mb-1">
            <label for="smtp-port" class="block font-medium text-sm"
              >SMTP Port</label
            >
          </div>
          <UInput
            id="smtp-port"
            v-model.number="emailState.smtpPort"
            type="number"
            :min="1"
            :max="65535"
            disabled
          />
          <p class="text-xs text-neutral-500 mt-1">SMTP server port</p>
        </div>

        <div>
          <div class="mb-1">
            <label for="smtp-user" class="block font-medium text-sm"
              >SMTP Username</label
            >
          </div>
          <UInput
            id="smtp-user"
            v-model="emailState.smtpUser"
            placeholder="username"
            disabled
          />
          <p class="text-xs text-neutral-500 mt-1">
            SMTP authentication username
          </p>
        </div>

        <div>
          <div class="mb-1">
            <label for="smtp-pass" class="block font-medium text-sm"
              >SMTP Password</label
            >
          </div>
          <UInput
            id="smtp-pass"
            v-model="emailState.smtpPass"
            type="password"
            placeholder="••••••••"
            disabled
          />
          <p class="text-xs text-neutral-500 mt-1">
            SMTP authentication password
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-2 mb-4">
        <UCheckbox
          id="use-tls"
          v-model="emailState.useTLS"
          name="useTLS"
          disabled
        />
        <label for="use-tls" class="font-medium">Use TLS</label>
      </div>

      <div class="flex justify-end">
        <UButton type="submit" :loading="props.isSaving" disabled>
          Save Email Settings
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
