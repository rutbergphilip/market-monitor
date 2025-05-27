export type Setting = {
  id?: string;
  key: string;
  value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export enum SettingKey {
  NOTIFICATION_DISCORD_WEBHOOKS = 'notification.discord.webhooks',
}
