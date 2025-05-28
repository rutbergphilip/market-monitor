import type { BaseAd } from '@/marketplaces/base';
import type { Notification } from '@/types/watchers';
import { ofetch } from 'ofetch';
import { NOTIFICATION_CONFIG } from '@/constants/notifications';
import logger from '@/integrations/logger';

/**
 * Formats a marketplace ad for notification
 */
function formatAdInfo(ad: BaseAd) {
  return {
    title: ad.title,
    price: `${ad.price.value}${ad.price.suffix || ''} ${ad.price.currency}`,
    url: ad.url,
    image: ad.images.length > 0 ? ad.images[0] : null,
    description: ad.description,
    marketplace: ad.marketplace,
    location: ad.location,
  };
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  retryDelay: number,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const errorMessage = lastError.message.toLowerCase();
      const isRetryableError =
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        lastError.name === 'FetchError';

      if (!isRetryableError || attempt === maxRetries - 1) {
        throw lastError;
      }

      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Sends a notification to Discord via webhook with retry capability
 */
export async function sendDiscordNotification(
  ads: BaseAd[],
  webhookUrl?: string,
  watcherInfo?: { queries: string[]; id?: string },
): Promise<void> {
  const { username, avatarUrl, maxRetries, retryDelay } =
    NOTIFICATION_CONFIG.discord;

  if (!webhookUrl) {
    logger.debug('Discord notification skipped - missing webhook URL');
    return;
  }

  try {
    const { enableBatching, batchSize } = NOTIFICATION_CONFIG.general;

    if (enableBatching && ads.length > 1) {
      // Process ads in batches
      for (let i = 0; i < ads.length; i += batchSize) {
        const batch = ads.slice(i, i + batchSize);

        logger.info({
          message: 'Sending Discord notification batch',
          batchSize: batch.length,
          batchNumber: Math.floor(i / batchSize) + 1,
          totalBatches: Math.ceil(ads.length / batchSize),
          watcherQueries: watcherInfo?.queries,
          watcherId: watcherInfo?.id,
        });

        await sendDiscordBatch(
          batch,
          webhookUrl,
          username,
          avatarUrl,
          maxRetries,
          retryDelay,
          watcherInfo,
        );

        // Wait between batches
        if (i + batchSize < ads.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } else {
      // Process ads individually
      logger.info({
        message: 'Sending individual Discord notifications',
        count: ads.length,
        watcherQueries: watcherInfo?.queries,
        watcherId: watcherInfo?.id,
      });

      for (const ad of ads) {
        await sendDiscordSingle(
          ad,
          webhookUrl,
          username,
          avatarUrl,
          maxRetries,
          retryDelay,
          watcherInfo,
        );

        // Wait between requests to avoid rate limits
        if (ads.indexOf(ad) < ads.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error sending Discord notification',
      adsCount: ads.length,
      watcherQueries: watcherInfo?.queries,
    });
  }
}

/**
 * Sends a batch of ads to Discord
 */
async function sendDiscordBatch(
  ads: BaseAd[],
  webhookUrl: string,
  username: string,
  avatarUrl: string,
  maxRetries: number,
  retryDelay: number,
  watcherInfo?: { queries: string[]; id?: string },
): Promise<void> {
  if (ads.length === 0) return;

  const defaultUsername = username || 'Marketplace Bot';
  const defaultAvatarUrl = avatarUrl || getDefaultAvatar(ads[0].marketplace);

  const embeds = ads.map((ad) => {
    const adInfo = formatAdInfo(ad);

    const fields = [
      {
        name: 'Price',
        value: adInfo.price,
        inline: true,
      },
      {
        name: 'Marketplace',
        value: adInfo.marketplace,
        inline: true,
      },
    ];

    if (adInfo.location) {
      fields.push({
        name: 'Location',
        value: adInfo.location,
        inline: true,
      });
    }

    if (watcherInfo?.queries && watcherInfo.queries.length > 0) {
      fields.push({
        name: 'Search Queries',
        value: watcherInfo.queries.join(', '),
        inline: false,
      });
    }

    if (watcherInfo?.id) {
      fields.push({
        name: 'Watcher ID',
        value: watcherInfo.id,
        inline: true,
      });
    }

    return {
      title: adInfo.title,
      url: adInfo.url,
      description:
        adInfo.description?.substring(0, 200) +
        (adInfo.description && adInfo.description.length > 200 ? '...' : ''),
      fields: fields,
      thumbnail: adInfo.image ? { url: adInfo.image } : undefined,
      timestamp: new Date().toISOString(),
      color: getMarketplaceColor(ad.marketplace),
    };
  });

  const contentMessage = `Found ${ads.length} new listings!`;

  await withRetry(
    async () => {
      await ofetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: defaultUsername,
          avatar_url: defaultAvatarUrl,
          content: contentMessage,
          embeds: embeds.slice(0, 10), // Discord limit
        }),
      });
      logger.debug({
        message: 'Batch Discord notification sent successfully',
        count: ads.length,
        watcherQueries: watcherInfo?.queries,
        watcherId: watcherInfo?.id,
      });
    },
    maxRetries,
    retryDelay,
  );
}

/**
 * Sends a single ad to Discord
 */
async function sendDiscordSingle(
  ad: BaseAd,
  webhookUrl: string,
  username: string,
  avatarUrl: string,
  maxRetries: number,
  retryDelay: number,
  watcherInfo?: { queries: string[]; id?: string },
): Promise<void> {
  const adInfo = formatAdInfo(ad);

  const defaultUsername = username || 'Marketplace Bot';
  const defaultAvatarUrl = avatarUrl || getDefaultAvatar(ad.marketplace);

  const fields = [
    {
      name: 'Price',
      value: adInfo.price,
      inline: true,
    },
    {
      name: 'Marketplace',
      value: adInfo.marketplace,
      inline: true,
    },
  ];

  if (adInfo.location) {
    fields.push({
      name: 'Location',
      value: adInfo.location,
      inline: true,
    });
  }

  if (watcherInfo?.queries && watcherInfo.queries.length > 0) {
    fields.push({
      name: 'Search Queries',
      value: watcherInfo.queries.join(', '),
      inline: false,
    });
  }

  await withRetry(
    async () => {
      await ofetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: defaultUsername,
          avatar_url: defaultAvatarUrl,
          embeds: [
            {
              title: adInfo.title,
              url: adInfo.url,
              description:
                adInfo.description?.substring(0, 200) +
                (adInfo.description && adInfo.description.length > 200
                  ? '...'
                  : ''),
              fields: fields,
              thumbnail: adInfo.image ? { url: adInfo.image } : undefined,
              timestamp: new Date().toISOString(),
              color: getMarketplaceColor(ad.marketplace),
            },
          ],
        }),
      });
      logger.debug({
        message: 'Single Discord notification sent successfully',
        ad: adInfo.title,
        marketplace: adInfo.marketplace,
        watcherQueries: watcherInfo?.queries,
        watcherId: watcherInfo?.id,
      });
    },
    maxRetries,
    retryDelay,
  );
}

/**
 * Get default avatar for marketplace
 */
function getDefaultAvatar(marketplace: string): string {
  const avatars = {
    BLOCKET:
      'https://public-assets.blocketcdn.se/static/images/blocketLogotype.png',
    TRADERA: 'https://tradera.se/favicon.ico',
    FACEBOOK: 'https://www.facebook.com/favicon.ico',
    EBAY: 'https://www.ebay.com/favicon.ico',
  };

  return avatars[marketplace as keyof typeof avatars] || avatars.BLOCKET;
}

/**
 * Get marketplace-specific color for Discord embeds
 */
function getMarketplaceColor(marketplace: string): number {
  const colors = {
    BLOCKET: 0x00a651, // Blocket green
    TRADERA: 0xff6900, // Tradera orange
    FACEBOOK: 0x1877f2, // Facebook blue
    EBAY: 0x0064d2, // eBay blue
  };

  return colors[marketplace as keyof typeof colors] || colors.BLOCKET;
}

/**
 * Sends an email notification (placeholder)
 */
async function sendEmailNotification(
  ads: BaseAd[],
  email?: string,
): Promise<void> {
  // Email implementation will go here
  logger.info({
    message: 'Email notification would be sent',
    count: ads.length,
    email: email || 'default',
    marketplaces: [...new Set(ads.map((ad) => ad.marketplace))],
  });
}

/**
 * Sends notifications about new ads through configured channels
 */
export async function notifyAboutAds(
  ads: BaseAd[],
  notifications?: Notification[],
  watcherInfo?: { queries: string[]; id?: string },
): Promise<void> {
  if (!ads || !ads.length) {
    logger.debug('No ads to notify about');
    return;
  }

  logger.info({
    message: 'Sending notifications for new ads',
    count: ads.length,
    marketplaces: [...new Set(ads.map((ad) => ad.marketplace))],
    customNotifications: notifications ? notifications.length : 0,
    watcherQueries: watcherInfo?.queries,
    watcherId: watcherInfo?.id,
  });

  const notificationPromises: Promise<void>[] = [];

  if (notifications && notifications.length > 0) {
    // Use provided notification configurations
    for (const notification of notifications) {
      if (notification.kind === 'DISCORD') {
        notificationPromises.push(
          sendDiscordNotification(ads, notification.webhook_url, watcherInfo),
        );
      } else if (notification.kind === 'EMAIL') {
        notificationPromises.push(
          sendEmailNotification(ads, notification.email),
        );
      }
    }
  } else {
    // Fall back to default notification behavior
    notificationPromises.push(sendEmailNotification(ads));
  }

  // Send notifications in parallel
  await Promise.all(notificationPromises);
}
