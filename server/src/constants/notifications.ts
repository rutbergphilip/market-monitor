import { freeze } from '@/utils/object';
import { SettingRepository } from '@/db/repositories';
import { SettingKey } from '@/types/settings';

/**
 * Notification configuration from database settings
 * These settings can be managed via the UI and are stored in the database
 */
export const NOTIFICATION_CONFIG = freeze({
  discord: {
    username: SettingRepository.getValue(
      SettingKey.NOTIFICATION_DISCORD_USERNAME,
    ),
    avatarUrl: SettingRepository.getValue(
      SettingKey.NOTIFICATION_DISCORD_AVATAR_URL,
    ),
    // Maximum number of retries for failed webhook calls
    maxRetries: parseInt(
      SettingRepository.getValue(SettingKey.NOTIFICATION_DISCORD_MAX_RETRIES) ||
        '3',
    ),
    // Delay between retries in ms
    retryDelay: parseInt(
      SettingRepository.getValue(SettingKey.NOTIFICATION_DISCORD_RETRY_DELAY) ||
        '1000',
    ),
  },
  email: {
    // Feature flag - disabled by default
    from: SettingRepository.getValue(SettingKey.NOTIFICATION_EMAIL_FROM),
    to: SettingRepository.getValue(SettingKey.NOTIFICATION_EMAIL_TO),
    subject: SettingRepository.getValue(SettingKey.NOTIFICATION_EMAIL_SUBJECT),
    smtpHost: SettingRepository.getValue(
      SettingKey.NOTIFICATION_EMAIL_SMTP_HOST,
    ),
    smtpPort: parseInt(
      SettingRepository.getValue(SettingKey.NOTIFICATION_EMAIL_SMTP_PORT) ||
        '587',
    ),
    smtpUser: SettingRepository.getValue(
      SettingKey.NOTIFICATION_EMAIL_SMTP_USER,
    ),
    smtpPass: SettingRepository.getValue(
      SettingKey.NOTIFICATION_EMAIL_SMTP_PASS,
    ),
    // TLS configuration
    useTLS:
      SettingRepository.getValue(SettingKey.NOTIFICATION_EMAIL_USE_TLS) ===
      'true',
  },
  // General notification settings
  general: {
    // Maximum number of notifications to send in one batch
    batchSize: parseInt(
      SettingRepository.getValue(SettingKey.NOTIFICATION_BATCH_SIZE) || '10',
    ),
    // Enable/disable notification batching
    enableBatching:
      SettingRepository.getValue(SettingKey.NOTIFICATION_ENABLE_BATCHING) ===
      'true',
  },
});
