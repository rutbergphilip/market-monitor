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
  });
}

export default {
  initSettingsEvents,
};
