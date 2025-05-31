export type Setting = {
  id?: string;
  key: string;
  value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export enum SettingKey {
  // Discord notification settings
  NOTIFICATION_DISCORD_USERNAME = 'notification.discord.username',
  NOTIFICATION_DISCORD_AVATAR_URL = 'notification.discord.avatar_url',
  NOTIFICATION_DISCORD_MAX_RETRIES = 'notification.discord.max_retries',
  NOTIFICATION_DISCORD_RETRY_DELAY = 'notification.discord.retry_delay',
  NOTIFICATION_DISCORD_WEBHOOKS = 'notification.discord.webhooks',

  // Email notification settings
  NOTIFICATION_EMAIL_FROM = 'notification.email.from',
  NOTIFICATION_EMAIL_TO = 'notification.email.to',
  NOTIFICATION_EMAIL_SUBJECT = 'notification.email.subject',
  NOTIFICATION_EMAIL_SMTP_HOST = 'notification.email.smtp_host',
  NOTIFICATION_EMAIL_SMTP_PORT = 'notification.email.smtp_port',
  NOTIFICATION_EMAIL_SMTP_USER = 'notification.email.smtp_user',
  NOTIFICATION_EMAIL_SMTP_PASS = 'notification.email.smtp_pass',
  NOTIFICATION_EMAIL_USE_TLS = 'notification.email.use_tls',

  // General notification settings
  NOTIFICATION_BATCH_SIZE = 'notification.general.batch_size',
  NOTIFICATION_RATE_LIMIT_REQUESTS = 'notification.general.rate_limit_requests',
  NOTIFICATION_RATE_LIMIT_WINDOW = 'notification.general.rate_limit_window',

  // Search settings
  SEARCH_DEFAULT_MIN_PRICE = 'search.default.min_price',
  SEARCH_DEFAULT_MAX_PRICE = 'search.default.max_price',
  SEARCH_DEFAULT_MARKETPLACE = 'search.default.marketplace',
  SEARCH_ENABLE_FUZZY_MATCHING = 'search.enable_fuzzy_matching',

  // Cache settings
  CACHE_TTL_SEARCH_RESULTS = 'cache.ttl.search_results',
  CACHE_TTL_USER_SESSIONS = 'cache.ttl.user_sessions',
  CACHE_MAX_ENTRIES = 'cache.max_entries',

  // System settings
  SYSTEM_LOG_LEVEL = 'system.log_level',
  SYSTEM_ENABLE_METRICS = 'system.enable_metrics',
  SYSTEM_MAX_CONCURRENT_WATCHERS = 'system.max_concurrent_watchers',
  SYSTEM_WATCHER_TIMEOUT = 'system.watcher_timeout',

  // API settings
  API_RATE_LIMIT_PER_USER = 'api.rate_limit.per_user',
  API_RATE_LIMIT_WINDOW = 'api.rate_limit.window',
  API_ENABLE_CORS = 'api.enable_cors',
  API_ALLOWED_ORIGINS = 'api.allowed_origins',

  // Security settings
  SECURITY_JWT_SECRET = 'security.jwt.secret',
  SECURITY_JWT_EXPIRES_IN = 'security.jwt.expires_in',
  SECURITY_PASSWORD_MIN_LENGTH = 'security.password.min_length',
  SECURITY_SESSION_TIMEOUT = 'security.session.timeout',
  SECURITY_ENABLE_2FA = 'security.enable_2fa',

  // Database settings
  DATABASE_BACKUP_ENABLED = 'database.backup.enabled',
  DATABASE_BACKUP_INTERVAL = 'database.backup.interval',
  DATABASE_BACKUP_RETENTION = 'database.backup.retention',
  DATABASE_VACUUM_INTERVAL = 'database.vacuum.interval',

  // Marketplace specific settings
  MARKETPLACE_BLOCKET_RATE_LIMIT = 'marketplace.blocket.rate_limit',
  MARKETPLACE_BLOCKET_TIMEOUT = 'marketplace.blocket.timeout',
  MARKETPLACE_TRADERA_RATE_LIMIT = 'marketplace.tradera.rate_limit',
  MARKETPLACE_TRADERA_TIMEOUT = 'marketplace.tradera.timeout',
}
