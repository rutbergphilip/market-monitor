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

export type WatcherQuery = {
  id?: string;
  query: string;
  enabled?: boolean;
};

export type Watcher = {
  id?: string;
  query: string; // Keep for backward compatibility, will be deprecated
  queries?: WatcherQuery[]; // New multiple queries support
  notifications: Notification[];
  schedule: string;
  status?: 'active' | 'stopped';
  last_run?: string | null;
  created_at?: string;
  updated_at?: string;
  min_price?: number | null;
  max_price?: number | null;
};
