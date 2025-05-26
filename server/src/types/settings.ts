export type Setting = {
  id?: string;
  key: string;
  value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

// Settings keys and their default values
export enum SettingKey {
  // Discord notification settings
  NOTIFICATION_DISCORD_USERNAME = 'notification.discord.username',
  NOTIFICATION_DISCORD_AVATAR_URL = 'notification.discord.avatar_url',
  NOTIFICATION_DISCORD_MAX_RETRIES = 'notification.discord.max_retries',
  NOTIFICATION_DISCORD_RETRY_DELAY = 'notification.discord.retry_delay',

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
  NOTIFICATION_ENABLE_BATCHING = 'notification.general.enable_batching',

  // Blocket query settings
  BLOCKET_QUERY_LIMIT = 'blocket.query.limit',
  BLOCKET_QUERY_SORT = 'blocket.query.sort',
  BLOCKET_QUERY_LISTING_TYPE = 'blocket.query.listing_type',
  BLOCKET_QUERY_STATUS = 'blocket.query.status',
  BLOCKET_QUERY_GEOLOCATION = 'blocket.query.geolocation',
  BLOCKET_QUERY_INCLUDE = 'blocket.query.include',

  // Blocket API settings
  BLOCKET_API_MAX_RETRIES = 'blocket.api.max_retries',
  BLOCKET_API_RETRY_DELAY = 'blocket.api.retry_delay',
  BLOCKET_API_TIMEOUT = 'blocket.api.timeout',

  // Account profile settings
  ACCOUNT_PROFILE_USERNAME = 'account.profile.username',
  ACCOUNT_PROFILE_EMAIL = 'account.profile.email',
  ACCOUNT_PROFILE_AVATAR_URL = 'account.profile.avatarUrl',

  // Security settings
  SECURITY_TOKEN_EXPIRY = 'security.token.expiry',
}

// Settings defaults
export const DEFAULT_SETTINGS: Record<
  SettingKey,
  { value: string; description: string }
> = {
  // Discord notification settings
  [SettingKey.NOTIFICATION_DISCORD_USERNAME]: {
    value: 'Blocket Bot',
    description: 'Username to display for Discord notifications',
  },
  [SettingKey.NOTIFICATION_DISCORD_AVATAR_URL]: {
    value:
      'https://media.licdn.com/dms/image/v2/C4D0BAQFRais3CkgqRw/company-logo_200_200/company-logo_200_200/0/1661494474152/blocket_se_logo?e=2147483647&v=beta&t=f6-lmVB7bEh-xK7tFOV5wa3AKgmLaTI5UeN1lc9PF_o',
    description: 'Avatar URL for Discord webhook',
  },
  [SettingKey.NOTIFICATION_DISCORD_MAX_RETRIES]: {
    value: '3',
    description: 'Maximum number of retries for failed Discord webhook calls',
  },
  [SettingKey.NOTIFICATION_DISCORD_RETRY_DELAY]: {
    value: '1000',
    description: 'Delay between retry attempts for Discord webhook in ms',
  },

  // Email notification settings
  [SettingKey.NOTIFICATION_EMAIL_FROM]: {
    value: '',
    description: 'Email address to send notifications from',
  },
  [SettingKey.NOTIFICATION_EMAIL_TO]: {
    value: '',
    description: 'Default email address to send notifications to',
  },
  [SettingKey.NOTIFICATION_EMAIL_SUBJECT]: {
    value: 'New Blocket listings found',
    description: 'Default subject line for email notifications',
  },
  [SettingKey.NOTIFICATION_EMAIL_SMTP_HOST]: {
    value: '',
    description: 'SMTP server hostname',
  },
  [SettingKey.NOTIFICATION_EMAIL_SMTP_PORT]: {
    value: '587',
    description: 'SMTP server port',
  },
  [SettingKey.NOTIFICATION_EMAIL_SMTP_USER]: {
    value: '',
    description: 'SMTP username',
  },
  [SettingKey.NOTIFICATION_EMAIL_SMTP_PASS]: {
    value: '',
    description: 'SMTP password',
  },
  [SettingKey.NOTIFICATION_EMAIL_USE_TLS]: {
    value: 'true',
    description: 'Enable TLS for SMTP connection',
  },

  // General notification settings
  [SettingKey.NOTIFICATION_BATCH_SIZE]: {
    value: '10',
    description: 'Maximum number of notifications to send in one batch',
  },
  [SettingKey.NOTIFICATION_ENABLE_BATCHING]: {
    value: 'true',
    description: 'Enable/disable notification batching',
  },

  // Blocket query settings
  [SettingKey.BLOCKET_QUERY_LIMIT]: {
    value: '60',
    description:
      'Maximum number of results to return from Blocket API per page',
  },
  [SettingKey.BLOCKET_QUERY_SORT]: {
    value: 'rel',
    description: 'Sort order for Blocket results (rel, dat, pri)',
  },
  [SettingKey.BLOCKET_QUERY_LISTING_TYPE]: {
    value: 's',
    description: 'Listing type (s = selling, w = wanted)',
  },
  [SettingKey.BLOCKET_QUERY_STATUS]: {
    value: 'active',
    description: 'Status of listings to fetch (active, all)',
  },
  [SettingKey.BLOCKET_QUERY_GEOLOCATION]: {
    value: '3',
    description: 'Geolocation filter (3 = Sweden)',
  },
  [SettingKey.BLOCKET_QUERY_INCLUDE]: {
    value: 'extend_with_shipping',
    description: 'Additional data to include in results',
  },

  // Blocket API settings
  [SettingKey.BLOCKET_API_MAX_RETRIES]: {
    value: '5',
    description: 'Maximum number of retries for Blocket API requests',
  },
  [SettingKey.BLOCKET_API_RETRY_DELAY]: {
    value: '3000',
    description: 'Base delay between retry attempts for Blocket API in ms',
  },
  [SettingKey.BLOCKET_API_TIMEOUT]: {
    value: '15000',
    description: 'Timeout for Blocket API requests in ms',
  },

  // Account profile settings
  [SettingKey.ACCOUNT_PROFILE_USERNAME]: {
    value: '',
    description: 'Username for account profile',
  },
  [SettingKey.ACCOUNT_PROFILE_EMAIL]: {
    value: '',
    description: 'Email address for account profile',
  },
  [SettingKey.ACCOUNT_PROFILE_AVATAR_URL]: {
    value: '',
    description: 'Avatar URL for user profile',
  },

  // Security settings
  [SettingKey.SECURITY_TOKEN_EXPIRY]: {
    value: '48h',
    description:
      'JWT token expiration time (e.g., 1h, 24h, 48h, 7d, or "never" for no expiry)',
  },
};
