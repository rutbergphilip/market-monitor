import client from 'blocket.js';

import { cache } from '@/cache/blocket';

import type { BlocketAd } from '@/types/blocket';

let isFirstRun = true;

/**
 * Fetches Blocket data
 * @function blocketJob
 * @returns {Promise<void>}
 */
export async function blocketJob(): Promise<void> {
  const data = await client.find({ query: 'dell optiplex 3070 micro' });
  if (!data) return;

  if (isFirstRun) return execFirstRun(data);

  // Check new ads and notify
}

function execFirstRun(ads: BlocketAd[]) {
  cache.clear();
  for (const ad of ads) {
    cache.set(ad.ad_id, ad);
  }
  isFirstRun = false;
}
