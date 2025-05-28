export type WatcherQuery = {
  id?: string;
  query: string;
  enabled?: boolean;
};

export type Watcher = {
  id?: string;
  queries: WatcherQuery[];
  notifications: Notification[];
  schedule: string;
  status?: 'active' | 'stopped';
  number_of_runs?: number;
  last_run?: string;
  created_at?: string;
  updated_at?: string;
  min_price?: number | null;
  max_price?: number | null;
};

// Re-export for convenience
export { type Notification, type NotificationKind } from './notifications';
