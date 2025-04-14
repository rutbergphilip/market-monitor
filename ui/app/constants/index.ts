export const NOTIFICATION_TARGETS: NotificationKind[] = ['DISCORD', 'EMAIL'];

export const DISABLED_NOTIFICATION_TARGETS: NotificationKind[] = ['EMAIL'];

export const NOTIFICATION_ICON_MAP: Record<NotificationKind, string> = {
  DISCORD: 'ic:baseline-discord',
  EMAIL: 'material-symbols:mail',
};

export const SCHEDULE_PRESETS = [
  { cron: '*/5 * * * *', label: 'Every 5 minutes' },
  { cron: '*/15 * * * *', label: 'Every 15 minutes' },
  { cron: '*/30 * * * *', label: 'Every 30 minutes' },
  { cron: '0 * * * *', label: 'Every hour' },
  { cron: '0 0 * * *', label: 'Daily at midnight' },
];
