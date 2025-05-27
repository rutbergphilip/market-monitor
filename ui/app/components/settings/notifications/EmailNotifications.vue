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
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div class="space-y-3">
        <p class="text-neutral-600 dark:text-neutral-400">
          SMTP email notifications for new listings (coming soon).
        </p>
        <UBadge color="neutral" size="md">Upcoming Feature</UBadge>
      </div>
    </div>

    <!-- Upcoming Feature Placeholder -->
    <div class="text-center py-16 px-8">
      <div class="max-w-md mx-auto space-y-6">
        <UIcon
          name="heroicons:envelope"
          class="text-8xl mb-6 opacity-30 mx-auto text-green-500"
        />
        <h4 class="font-semibold text-xl mb-3">Email Notifications</h4>
        <p class="text-neutral-500 mb-6 leading-relaxed">
          SMTP email support is coming in a future update. This will allow you
          to receive notifications via email with full customization options.
        </p>
        <UBadge color="warning" variant="soft" size="lg">
          <UIcon name="heroicons:clock" class="mr-2" />
          Coming Soon
        </UBadge>
      </div>
    </div>

    <!-- Future Implementation (currently disabled) -->
    <UForm
      v-if="false"
      :schema="emailSchema"
      :state="emailState"
      class="space-y-8"
      @submit="saveEmailSettings"
    >
      <div class="flex items-center space-x-3 mb-6">
        <UCheckbox
          id="email-enabled"
          v-model="emailState.enabled"
          name="enabled"
          disabled
          size="md"
        />
        <label for="email-enabled" class="font-semibold text-lg"
          >Enable Email Notifications</label
        >
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <UFormGroup
          class="flex flex-col"
          label="From Email"
          description="Sender email address"
          name="from"
        >
          <label
            for="fromEmail"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            From Email
          </label>
          <UInput
            v-model="emailState.from"
            placeholder="sender@example.com"
            size="md"
            disabled
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Sender email address
          </p>
        </UFormGroup>

        <UFormGroup
          class="flex flex-col"
          label="To Email"
          description="Recipient email address"
          name="to"
        >
          <label
            for="toEmail"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            To Email
          </label>
          <UInput
            v-model="emailState.to"
            placeholder="recipient@example.com"
            size="md"
            disabled
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Recipient email address
          </p>
        </UFormGroup>

        <UFormGroup
          class="flex flex-col md:col-span-2"
          label="Email Subject"
          description="Subject line for notification emails"
          name="subject"
        >
          <label
            for="emailSubject"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            Email Subject
          </label>
          <UInput
            v-model="emailState.subject"
            placeholder="New Blocket Listings"
            size="md"
            disabled
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Subject line for notification emails
          </p>
        </UFormGroup>

        <UFormGroup
          class="flex flex-col"
          label="SMTP Host"
          description="SMTP server address"
          name="smtpHost"
        >
          <label
            for="smtpHost"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            SMTP Host
          </label>
          <UInput
            v-model="emailState.smtpHost"
            placeholder="smtp.example.com"
            size="md"
            disabled
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            SMTP server address
          </p>
        </UFormGroup>

        <UFormGroup
          class="flex flex-col"
          label="SMTP Port"
          description="SMTP server port"
          name="smtpPort"
        >
          <label
            for="smtpPort"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            SMTP Port
          </label>
          <UInput
            v-model.number="emailState.smtpPort"
            type="number"
            :min="1"
            :max="65535"
            size="md"
            class="w-32"
            disabled
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            SMTP server port
          </p>
        </UFormGroup>

        <UFormGroup
          class="flex flex-col"
          label="SMTP Username"
          description="SMTP authentication username"
          name="smtpUser"
        >
          <label
            for="smtpUser"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            SMTP Username
          </label>
          <UInput
            v-model="emailState.smtpUser"
            placeholder="username"
            size="md"
            disabled
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            SMTP authentication username
          </p>
        </UFormGroup>

        <UFormGroup
          class="flex flex-col"
          label="SMTP Password"
          description="SMTP authentication password"
          name="smtpPass"
        >
          <label
            for="smtpPass"
            class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
          >
            SMTP Password
          </label>
          <UInput
            v-model="emailState.smtpPass"
            type="password"
            placeholder="••••••••"
            size="md"
            disabled
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            SMTP authentication password
          </p>
        </UFormGroup>
      </div>

      <UFormGroup
        class="flex flex-col"
        name="useTLS"
        description="Use TLS encryption for secure email transmission"
      >
        <UCheckbox
          v-model="emailState.useTLS"
          name="useTLS"
          label="Use TLS Encryption"
          size="md"
          disabled
        />
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Use TLS encryption for secure email transmission
        </p>
      </UFormGroup>

      <UDivider class="my-8" />

      <div class="flex justify-end pt-4">
        <UButton type="submit" size="md" :loading="props.isSaving" disabled>
          Save Email Settings
        </UButton>
      </div>
    </UForm>
  </div>
</template>
