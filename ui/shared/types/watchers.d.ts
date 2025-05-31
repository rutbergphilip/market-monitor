export type MarketplaceType = 'BLOCKET' | 'TRADERA';

export type WatcherQuery = {
  id?: string;
  query: string;
  enabled?: boolean;
  marketplace?: MarketplaceType; // Add marketplace support
  filters?: Record<string, unknown>; // Marketplace-specific filters
};

export type Watcher = {
  id?: string;
  queries: WatcherQuery[];
  notifications: Notification[];
  schedule: string;
  status?: 'active' | 'stopped';
  last_run?: string | null;
  created_at?: string;
  updated_at?: string;
  min_price?: number | null;
  max_price?: number | null;
  marketplace?: MarketplaceType; // Default marketplace for legacy support
};

// Re-export for convenience
export { type Notification, type NotificationKind } from './notifications';
