import emitter, { SettingsEvents } from '@/events';
import { SettingRepository } from '@/db/repositories';
import { SettingKey } from '@/types/settings';
import logger from '@/integrations/logger';
import { refreshNotificationConfig } from '@/constants/notifications';

/**
 * Initialize settings event listeners
 */
export function initSettingsEvents(): void {
  emitter.on(SettingsEvents.UPDATED, (data: { key: string; value: any }) => {
    // Only refresh notification config for notification-related settings
    const notificationPrefixes = ['notification.', 'blocket.'];
    const isNotificationSetting = notificationPrefixes.some((prefix) =>
      data.key.startsWith(prefix),
    );

    if (isNotificationSetting || data.key === 'all') {
      try {
        logger.debug({
          message: 'Refreshing notification config due to settings update',
          updatedSetting: data.key,
        });

        // Refresh notification configuration
        refreshNotificationConfig();
      } catch (error) {
        logger.error({
          error: error as Error,
          message: 'Failed to refresh notification config',
          settingKey: data.key,
        });
      }
    } else {
      logger.debug({
        message:
          'Skipping notification config refresh for non-notification setting',
        updatedSetting: data.key,
      });
    }
  });
}

export default {
  initSettingsEvents,
};
