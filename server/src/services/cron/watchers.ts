import { CronJob } from 'cron';
import client, { type BlocketAd } from 'blocket.js';
import logger from '@/integrations/logger';
import { notifyAboutAds } from '@/services/notification';
import { BLOCKET_QUERY } from '@/constants/cron';
import type { Watcher } from '@/types/watchers';
import eventEmitter, { WatcherEvents } from '@/events';

const watcherJobs = new Map<string, CronJob>();
const watcherCaches = new Map<string, Map<string, BlocketAd>>();

/**
 * Fetches Blocket data for a specific watcher
 * @param watcher - The watcher to fetch ads for
 * @returns {Promise<BlocketAd[]>}
 */
async function fetchAdsForWatcher(watcher: Watcher): Promise<BlocketAd[]> {
  const queryConfig = { ...BLOCKET_QUERY, query: watcher.query };
  return client.find(queryConfig);
}

/**
 * Creates a cron job function for a specific watcher
 * @param watcher - The watcher to create a job for
 * @returns {Function} - The job function
 */
function createWatcherJobFunction(watcher: Watcher): () => Promise<void> {
  if (!watcherCaches.has(watcher.id!)) {
    watcherCaches.set(watcher.id!, new Map<string, BlocketAd>());
  }

  let isFirstRun = true;

  return async () => {
    try {
      eventEmitter.emit(WatcherEvents.RUN, watcher.id!);

      const cache = watcherCaches.get(watcher.id!)!;
      const ads = await fetchAdsForWatcher(watcher);

      if (!ads || !Array.isArray(ads)) {
        logger.warn({
          message: `No results for watcher query`,
          watcherId: watcher.id,
          query: watcher.query,
        });
        return;
      }

      // Filter ads based on price range if configured
      const filteredAds = ads.filter((ad) => {
        if (!ad.price || !ad.price.value) return true;

        // Apply minimum price filter if set
        if (watcher.min_price !== undefined && watcher.min_price !== null) {
          if (ad.price.value < watcher.min_price) return false;
        }

        // Apply maximum price filter if set
        if (watcher.max_price !== undefined && watcher.max_price !== null) {
          if (ad.price.value > watcher.max_price) return false;
        }

        return true;
      });

      if (isFirstRun) {
        for (const ad of filteredAds) {
          cache.set(ad.ad_id, ad);
        }
        isFirstRun = false;
        logger.info({
          message: `First run for watcher: cached ${filteredAds.length} existing ads (${ads.length - filteredAds.length} excluded by price range)`,
          watcherId: watcher.id,
          query: watcher.query,
          priceRange: {
            min: watcher.min_price,
            max: watcher.max_price,
          },
        });
        return;
      }

      const newAds = filteredAds.filter((ad) => !cache.has(ad.ad_id));

      if (newAds.length > 0) {
        // Pass watcher info when sending notifications
        const watcherInfo = {
          query: watcher.query,
          id: watcher.id!,
        };

        await notifyAboutAds(newAds, watcher.notifications, watcherInfo);

        for (const ad of newAds) {
          cache.set(ad.ad_id, ad);
        }
      }

      logger.info({
        message: `Job completed for watcher: found ${newAds.length} new ads`,
        watcherId: watcher.id,
        query: watcher.query,
        priceRange: {
          min: watcher.min_price,
          max: watcher.max_price,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({
        error: error as Error,
        message: `Error in watcher job`,
        watcherId: watcher.id,
        query: watcher.query,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Creates and starts a cron job for a watcher
 * @param watcher - The watcher to start a job for
 */
export function startWatcherJob(watcher: Watcher): void {
  if (!watcher.id) {
    logger.error({
      message: 'Attempted to start a job for a watcher without ID',
      watcher,
    });
    return;
  }

  if (watcherJobs.has(watcher.id)) {
    stopWatcherJob(watcher.id);
  }

  try {
    const job = new CronJob(
      watcher.schedule,
      createWatcherJobFunction(watcher),
      null,
      true, // Start the job right away
      'Europe/Stockholm', // Using default timezone
    );

    watcherJobs.set(watcher.id, job);

    logger.info({
      message: 'Watcher job started',
      watcherId: watcher.id,
      schedule: watcher.schedule,
      query: watcher.query,
    });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Failed to create cron job for watcher',
      watcherId: watcher.id,
      schedule: watcher.schedule,
    });
  }
}

/**
 * Stops a running cron job for a watcher and cleans up resources
 * @param watcherId - The ID of the watcher to stop
 */
export function stopWatcherJob(watcherId: string): void {
  const job = watcherJobs.get(watcherId);

  if (job) {
    job.stop();
    watcherJobs.delete(watcherId);

    // Also clean up the cache for this watcher to prevent memory leaks
    if (watcherCaches.has(watcherId)) {
      watcherCaches.delete(watcherId);
    }

    logger.info({
      message: 'Watcher job stopped and resources cleaned up',
      watcherId,
    });
  }
}

/**
 * Gets all active watcher jobs
 * @returns {string[]} - Array of active watcher IDs
 */
export function getActiveWatcherJobs(): string[] {
  return Array.from(watcherJobs.keys());
}

/**
 * Initializes jobs for all active watchers
 * @param watchers - Array of watchers to initialize
 */
export function initializeWatcherJobs(watchers: Watcher[]): void {
  for (const id of watcherJobs.keys()) {
    stopWatcherJob(id);
  }

  for (const watcher of watchers) {
    if (watcher.id && watcher.status === 'active') {
      startWatcherJob(watcher);
    }
  }

  logger.info({
    message: `Initialized ${watchers.filter((w) => w.status === 'active').length} watcher jobs`,
  });
}

/**
 * Manually run a watcher job once immediately
 * This runs the watcher function once without affecting its scheduled cron job
 * @param watcher - The watcher to run manually
 */
export async function runWatcherManually(watcher: Watcher): Promise<void> {
  if (!watcher.id) {
    logger.error({
      message: 'Attempted to run a watcher without ID',
      watcher,
    });
    return;
  }

  logger.info({
    message: 'Manually triggering watcher job',
    watcherId: watcher.id,
    query: watcher.query,
  });

  try {
    // Get the watcher job function
    const jobFunction = createWatcherJobFunction(watcher);

    // Execute the job function immediately
    await jobFunction();

    logger.info({
      message: 'Manual watcher job completed',
      watcherId: watcher.id,
      query: watcher.query,
    });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error in manual watcher job execution',
      watcherId: watcher.id,
      query: watcher.query,
    });
    throw error;
  }
}
