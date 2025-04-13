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
