/**
 * Shared types index
 * Re-exports all shared types for convenient importing
 */

// Auth types
export type { User, LoginResponse, TokenResponse } from './auth';

// Settings types
export type { Setting } from './settings';

export { SettingKey } from './settings';

// Watchers types
export type { WatcherQuery, Watcher, MarketplaceType } from './watchers';

// Notifications types
export type {
  NotificationKind,
  DiscordNotification,
  EmailNotification,
  Notification,
} from './notifications';

// Common types
export type {
  JWTPayload,
  FormStateOptions,
  ApiError,
  ApiResponse,
  PaginationOptions,
  PaginatedResponse,
} from './common';
