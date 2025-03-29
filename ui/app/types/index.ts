export type NotificationTarget = 'DISCORD' | 'EMAIL' | 'SLACK';

export type Watcher = {
  id: string;
  status: 'active' | 'paused';
  query: string;
  number_of_runs: number;
  last_run: string;
  notifications: NotificationTarget[];
  schedule: string;
  created_at?: string;
  updated_at?: string;
};
