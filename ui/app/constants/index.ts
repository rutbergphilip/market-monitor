import type { NotificationTarget } from '~/types';

export const NOTIFICATION_ICON_MAP: Record<NotificationTarget, string> = {
  DISCORD: 'ic:baseline-discord',
  EMAIL: 'material-symbols:mail',
  SLACK: 'mdi:slack',
};
