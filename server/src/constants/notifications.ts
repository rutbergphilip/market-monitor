import { freeze } from '@/utils/object';
import { SettingRepository } from '@/db/repositories';
import { SettingKey } from '@/types/settings';
import logger from '@/integrations/logger';

// Create a mutable reference to hold the notification config
let notificationConfig = {
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
};

// Export a frozen version of the config
export const NOTIFICATION_CONFIG = freeze(notificationConfig);

/**
 * Refresh the notification configuration from the database
 * This is called when settings are updated via the UI
 */
export function refreshNotificationConfig(): void {
  try {
    // Create a new config object with fresh values from the database
    const refreshedConfig = {
      discord: {
        username: SettingRepository.getValue(
          SettingKey.NOTIFICATION_DISCORD_USERNAME,
        ),
        avatarUrl: SettingRepository.getValue(
          SettingKey.NOTIFICATION_DISCORD_AVATAR_URL,
        ),
        maxRetries: parseInt(
          SettingRepository.getValue(
            SettingKey.NOTIFICATION_DISCORD_MAX_RETRIES,
          ) || '3',
        ),
        retryDelay: parseInt(
          SettingRepository.getValue(
            SettingKey.NOTIFICATION_DISCORD_RETRY_DELAY,
          ) || '1000',
        ),
      },
      email: {
        from: SettingRepository.getValue(SettingKey.NOTIFICATION_EMAIL_FROM),
        to: SettingRepository.getValue(SettingKey.NOTIFICATION_EMAIL_TO),
        subject: SettingRepository.getValue(
          SettingKey.NOTIFICATION_EMAIL_SUBJECT,
        ),
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
        useTLS:
          SettingRepository.getValue(SettingKey.NOTIFICATION_EMAIL_USE_TLS) ===
          'true',
      },
      general: {
        batchSize: parseInt(
          SettingRepository.getValue(SettingKey.NOTIFICATION_BATCH_SIZE) ||
            '10',
        ),
        enableBatching:
          SettingRepository.getValue(
            SettingKey.NOTIFICATION_ENABLE_BATCHING,
          ) === 'true',
      },
    };

    // Update the mutable reference
    Object.assign(notificationConfig, refreshedConfig);

    logger.debug({
      message: 'Notification config refreshed successfully',
    });
  } catch (error) {
    logger.error({
      message: 'Failed to refresh notification config',
      error: error as Error,
    });
  }
}
