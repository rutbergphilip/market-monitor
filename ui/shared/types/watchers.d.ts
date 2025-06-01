export type MarketplaceType = 'BLOCKET' | 'TRADERA';

export type WatcherQuery = {
  id?: string;
  query: string;
  enabled?: boolean;
  marketplace?: MarketplaceType;
  filters?: Record<string, unknown>;
};

export type Watcher = {
  id?: string;
  queries: WatcherQuery[];
  notifications: import('./notifications').Notification[];
  schedule: string;
  status?: 'active' | 'stopped';
  last_run?: string | null;
  created_at?: string;
  updated_at?: string;
  min_price?: number | null;
  max_price?: number | null;
  marketplace?: MarketplaceType;
};
