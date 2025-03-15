import { NOTIFICATION_CONFIG } from '@/constants/notifications';
import { BlocketAd } from '@/types/blocket';
import { ofetch } from 'ofetch';

/**
 * Formats a Blocket ad for notification
 * @param ad The Blocket ad to format
 * @returns Formatted ad information
 */
function formatAdInfo(ad: BlocketAd) {
  return {
    title: ad.subject,
    price: `${ad.price?.value}${ad.price?.suffix || ''}`,
    url: ad.share_url,
    image: ad.images && ad.images.length > 0 ? ad.images[0].url : null,
    description: ad.body,
  };
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param retryDelay Base delay between retries
 * @returns Result of the function or throws error after max retries
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  retryDelay: number
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}`
      );

      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay =
          retryDelay * Math.pow(1.5, attempt) * (0.9 + Math.random() * 0.2);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Operation failed after multiple retries');
}

/**
 * Sends a notification to Discord via webhook with retry capability
 * @param ads List of Blocket ads to notify about
 */
export async function sendDiscordNotification(ads: BlocketAd[]): Promise<void> {
  const { webhookUrl, enabled, username, avatarUrl, maxRetries, retryDelay } =
    NOTIFICATION_CONFIG.discord;

  if (!enabled || !webhookUrl) {
    return;
  }

  try {
    const { enableBatching, batchSize } = NOTIFICATION_CONFIG.general;

    if (enableBatching && ads.length > 1) {
      // Process ads in batches
      for (let i = 0; i < ads.length; i += batchSize) {
        const batch = ads.slice(i, i + batchSize);

        await sendDiscordBatch(
          batch,
          webhookUrl,
          username,
          avatarUrl,
          maxRetries,
          retryDelay
        );

        // Wait a bit between batches
        if (i + batchSize < ads.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } else {
      // Process ads individually
      for (const ad of ads) {
        await sendDiscordSingle(
          ad,
          webhookUrl,
          username,
          avatarUrl,
          maxRetries,
          retryDelay
        );

        // Wait a bit between requests to avoid rate limits
        if (ads.indexOf(ad) < ads.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

/**
 * Sends a batch of ads to Discord
 */
async function sendDiscordBatch(
  ads: BlocketAd[],
  webhookUrl: string,
  username: string,
  avatarUrl: string,
  maxRetries: number,
  retryDelay: number
): Promise<void> {
  if (ads.length === 0) return;

  const defaultUsername = username || 'Blocket Bot';
  const defaultAvatarUrl = avatarUrl || ads[0]?.images?.[0]?.url || undefined;

  const embeds = ads.map((ad) => {
    const adInfo = formatAdInfo(ad);
    return {
      title: adInfo.title,
      url: adInfo.url,
      description:
        adInfo.description?.substring(0, 200) +
        (adInfo.description?.length > 200 ? '...' : ''),
      fields: [
        {
          name: 'Price',
          value: adInfo.price,
          inline: true,
        },
      ],
      thumbnail: adInfo.image ? { url: adInfo.image } : undefined,
      timestamp: new Date().toISOString(),
    };
  });

  await withRetry(
    async () => {
      await ofetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: defaultUsername,
          avatar_url: defaultAvatarUrl,
          content: `Found ${ads.length} new listings!`,
          embeds: embeds.slice(0, 10),
        }),
      });
    },
    maxRetries,
    retryDelay
  );
}

/**
 * Sends a single ad to Discord
 */
async function sendDiscordSingle(
  ad: BlocketAd,
  webhookUrl: string,
  username: string,
  avatarUrl: string,
  maxRetries: number,
  retryDelay: number
): Promise<void> {
  const adInfo = formatAdInfo(ad);

  const defaultUsername = username || 'Blocket Bot';
  const defaultAvatarUrl = avatarUrl || ad.images?.[0]?.url || undefined;

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
                (adInfo.description?.length > 200 ? '...' : ''),
              fields: [
                {
                  name: 'Price',
                  value: adInfo.price,
                  inline: true,
                },
              ],
              thumbnail: adInfo.image ? { url: adInfo.image } : undefined,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    },
    maxRetries,
    retryDelay
  );
}

/**
 * Sends an email notification (feature flagged off by default, upcoming feature)
 * @param ads List of Blocket ads to notify about
 */
async function sendEmailNotification(ads: BlocketAd[]): Promise<void> {
  const { enabled } = NOTIFICATION_CONFIG.email;

  // Feature flagged off by default
  if (!enabled) {
    return;
  }

  // Email implementation would go here when feature flag is enabled
  // This would use the environment variables from NOTIFICATION_CONFIG.email
  console.log('Email notification would be sent for', ads.length, 'ads');
}

/**
 * Sends notifications about new ads through configured channels
 * @param ads List of new Blocket ads
 */
export async function notifyAboutAds(ads: BlocketAd[]): Promise<void> {
  if (!ads || !ads.length) {
    return;
  }

  // Send notifications in parallel
  await Promise.all([sendDiscordNotification(ads), sendEmailNotification(ads)]);
}
