import client, { type BlocketAd } from 'blocket.js';

import { BLOCKET_QUERY, BLOCKET_QUERIES } from '@/constants/cron';
import { notifyAboutAds } from '@/services/notification';
import { cache } from '@/cache/blocket';
import logger from '@/integrations/logger';

let isFirstRun = true;

/**
 * Fetches Blocket data
 * @function fetchAdsForQuery
 * @param {string} query - The query for fetching ads
 * @returns {Promise<BlocketAd[]>}
 */
async function fetchAdsForQuery(query: string): Promise<BlocketAd[]> {
  const queryConfig = { ...BLOCKET_QUERY, query };
  return client.find(queryConfig);
}

export async function blocketJob(): Promise<void> {
  try {
    const allAds = await Promise.all(BLOCKET_QUERIES.map(fetchAdsForQuery));
    const data = allAds.flat();
    if (!data || !Array.isArray(data)) return;

    if (isFirstRun) return execFirstRun(data as BlocketAd[]);

    const newAds = identifyNewAds(data as BlocketAd[]);

    if (newAds.length > 0) {
      await notifyAboutAds(newAds);
      for (const ad of newAds) {
        cache.set(ad.ad_id, ad);
      }
    }

    logger.info({
      message: `Job completed: found ${newAds.length} new ads`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error in blocket job',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handles first run by caching all existing ads
 * @function execFirstRun
 * @param {BlocketAd[]} ads - List of Blocket ads
 */
function execFirstRun(ads: BlocketAd[]): void {
  cache.clear();
  for (const ad of ads) {
    cache.set(ad.ad_id, ad);
  }
  isFirstRun = false;
  logger.info({
    message: `First run completed: cached ${ads.length} existing ads`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Identifies new ads by comparing with cache
 * @function identifyNewAds
 * @param {BlocketAd[]} ads - List of current Blocket ads
 * @returns {BlocketAd[]} Array of new ads
 */
function identifyNewAds(ads: BlocketAd[]): BlocketAd[] {
  return ads.filter((ad) => !cache.has(ad.ad_id));
}
