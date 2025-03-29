export type NotificationTarget = 'DISCORD' | 'EMAIL' | 'SLACK';

export type Watcher = {
  id: string;
  status: 'active' | 'paused';
  query: string;
  numberOfRuns: number;
  lastRun: string;
  notifications: NotificationTarget[];
};
