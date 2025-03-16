import client, { type BlocketAd } from 'blocket.js';

import { BLOCKET_QUERY, BLOCKET_QUERIES } from '@/constants/cron';
import { notifyAboutAds } from '@/services/notification';
import { cache } from '@/cache/blocket';

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

    console.log(
      `Job completed: ${new Date().toISOString()}, found ${newAds.length} new ads`,
    );
  } catch (error) {
    console.error('Error in blocket job:', error);
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
  console.log(
    `First run completed: ${new Date().toISOString()}, cached ${
      ads.length
    } existing ads`,
  );
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
