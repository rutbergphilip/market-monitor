export type NotificationKind = 'DISCORD' | 'EMAIL';

export type DiscordNotification = {
  kind: 'DISCORD';
  webhook_url: string;
};

export type EmailNotification = {
  kind: 'EMAIL';
  email: string;
};

export type Notification = DiscordNotification | EmailNotification;

export type Watcher = {
  id?: string;
  query: string;
  notifications: Notification[];
  schedule: string;
  status?: 'active' | 'stopped';
  number_of_runs?: number;
  last_run?: string | null;
  created_at?: string;
  updated_at?: string;
};
