<script lang="ts" setup>
import * as z from 'zod';

const props = defineProps<{
  isLoading: boolean;
  isSaving: boolean;
  settings?: {
    enabled: boolean;
    from: string;
    to: string;
    subject: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    useTLS: boolean;
  };
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
  enabled: props.settings?.enabled || false,
  from: props.settings?.from || '',
  to: props.settings?.to || '',
  subject: props.settings?.subject || 'New Blocket listings found',
  smtpHost: props.settings?.smtpHost || '',
  smtpPort: props.settings?.smtpPort || 587,
  smtpUser: props.settings?.smtpUser || '',
  smtpPass: props.settings?.smtpPass || '',
  useTLS: props.settings?.useTLS || true,
});

defineExpose({
  emailState,
});

function saveEmailSettings() {
  emit('save');
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          SMTP email notifications for new listings (coming soon).
        </p>
        <UBadge color="neutral">Upcoming Feature</UBadge>
      </div>
    </div>

    <!-- Upcoming Feature Placeholder -->
    <div
      class="text-center py-8 text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700"
    >
      <UIcon name="material-symbols:mail" class="text-4xl mb-2 opacity-50" />
      <h4 class="font-medium mb-1">Email Notifications</h4>
      <p class="text-sm">SMTP email support coming in a future update</p>
    </div>

    <!-- Future Implementation (currently disabled) -->
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
  </div>
</template>
