import { freeze } from '@/utils/object';

/**
 * Notification configuration from environment variables
 * For Docker/K8s deployments, these can be set via:
 * - Docker: environment variables in docker-compose.yml or docker run command
 * - Kubernetes: environment variables in deployment manifest or ConfigMap
 */
export const NOTIFICATION_CONFIG = freeze({
  discord: {
    enabled: process.env.NOTIFICATION_DISCORD_ENABLED === 'true',
    webhookUrl: process.env.NOTIFICATION_DISCORD_WEBHOOK_URL || '',
    username: process.env.NOTIFICATION_DISCORD_USERNAME || '',
    avatarUrl:
      process.env.NOTIFICATION_DISCORD_AVATAR_URL ||
      'https://media.licdn.com/dms/image/v2/C4D0BAQFRais3CkgqRw/company-logo_200_200/company-logo_200_200/0/1661494474152/blocket_se_logo?e=2147483647&v=beta&t=f6-lmVB7bEh-xK7tFOV5wa3AKgmLaTI5UeN1lc9PF_o',
    // Maximum number of retries for failed webhook calls
    maxRetries: parseInt(process.env.NOTIFICATION_DISCORD_MAX_RETRIES || '3'),
    // Delay between retries in ms
    retryDelay: parseInt(
      process.env.NOTIFICATION_DISCORD_RETRY_DELAY || '1000'
    ),
  },
  email: {
    // Feature flag - disabled by default
    enabled: process.env.NOTIFICATION_EMAIL_ENABLED === 'true',
    from: process.env.NOTIFICATION_EMAIL_FROM || '',
    to: process.env.NOTIFICATION_EMAIL_TO || '',
    subject: process.env.NOTIFICATION_EMAIL_SUBJECT || '',
    smtpHost: process.env.NOTIFICATION_EMAIL_SMTP_HOST || '',
    smtpPort: parseInt(process.env.NOTIFICATION_EMAIL_SMTP_PORT || '587'),
    smtpUser: process.env.NOTIFICATION_EMAIL_SMTP_USER || '',
    smtpPass: process.env.NOTIFICATION_EMAIL_SMTP_PASS || '',
    // TLS configuration
    useTLS: process.env.NOTIFICATION_EMAIL_USE_TLS === 'true',
  },
  // General notification settings
  general: {
    // Maximum number of notifications to send in one batch
    batchSize: parseInt(process.env.NOTIFICATION_BATCH_SIZE || '10'),
    // Enable/disable notification batching
    enableBatching: process.env.NOTIFICATION_ENABLE_BATCHING === 'true',
  },
});
