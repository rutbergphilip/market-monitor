import type { NotificationTarget } from '~/types';

export const AVAILABLE_NOTIFICATION_TARGETS: NotificationTarget[] = [
  'DISCORD',
  'EMAIL',
  'SLACK',
];

export const NOTIFICATION_ICON_MAP: Record<NotificationTarget, string> = {
  DISCORD: 'ic:baseline-discord',
  EMAIL: 'material-symbols:mail',
  SLACK: 'mdi:slack',
};

export const SCHEDULE_PRESETS = [
  { cron: '*/5 * * * *', label: 'Every 5 minutes' },
  { cron: '*/15 * * * *', label: 'Every 15 minutes' },
  { cron: '*/30 * * * *', label: 'Every 30 minutes' },
  { cron: '0 * * * *', label: 'Every hour' },
  { cron: '0 0 * * *', label: 'Daily at midnight' },
];
