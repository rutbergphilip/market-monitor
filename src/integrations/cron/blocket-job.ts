import client from 'blocket.js';
import { cache } from '@/cache/blocket';
import { BLOCKET_QUERY } from '@/constants/cron';
import { notifyAboutAds } from '@/services/notification';
import type { BlocketAd } from '@/types/blocket';

let isFirstRun = true;

/**
 * Fetches Blocket data
 * @function blocketJob
 * @returns {Promise<void>}
 */
export async function blocketJob(): Promise<void> {
  try {
    const data = await client.find(BLOCKET_QUERY);
    if (!data || !Array.isArray(data)) return;

    if (isFirstRun) return execFirstRun(data as BlocketAd[]);

    // Check for new ads and notify
    const newAds = identifyNewAds(data as BlocketAd[]);

    if (newAds.length > 0) {
      // Use the new notification service
      await notifyAboutAds(newAds);

      // Update cache with new ads
      for (const ad of newAds) {
        cache.set(ad.ad_id, ad);
      }
    }

    console.log(
      `Job completed: ${new Date().toISOString()}, found ${
        newAds.length
      } new ads`
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
    } existing ads`
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
