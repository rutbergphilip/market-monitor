export type Watcher = {
  id?: string;
  query: string;
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
