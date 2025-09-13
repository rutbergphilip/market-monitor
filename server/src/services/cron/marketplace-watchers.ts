import { CronJob } from 'cron';
import logger from '@/integrations/logger';
import { notifyAboutAds } from '@/services/marketplace/notifications';
import { marketplaceCache } from '@/services/marketplace/cache';
import { getMarketplaceAdapter } from '@/marketplaces';
import { SettingRepository } from '@/db/repositories';
import { SettingKey } from '@/types/settings';
import type { Watcher } from '@/types/watchers';
import type {
  BaseAd,
  MarketplaceType,
  SearchQuery,
  SearchConfig,
} from '@/marketplaces/base';
import eventEmitter, { WatcherEvents } from '@/events';

const watcherJobs = new Map<string, CronJob>();

/**
 * Get marketplace settings with fallback to legacy settings
 */
function getMarketplaceSettings(marketplace: MarketplaceType) {
  const settingsMap: Record<MarketplaceType, any> = {
    BLOCKET: {
      maxRetries: [
        SettingKey.MARKETPLACE_BLOCKET_API_MAX_RETRIES,
        SettingKey.BLOCKET_API_MAX_RETRIES,
      ],
      retryDelay: [
        SettingKey.MARKETPLACE_BLOCKET_API_RETRY_DELAY,
        SettingKey.BLOCKET_API_RETRY_DELAY,
      ],
      timeout: [
        SettingKey.MARKETPLACE_BLOCKET_API_TIMEOUT,
        SettingKey.BLOCKET_API_TIMEOUT,
      ],
      limit: [
        SettingKey.MARKETPLACE_BLOCKET_QUERY_LIMIT,
        SettingKey.BLOCKET_QUERY_LIMIT,
      ],
      sort: [
        SettingKey.MARKETPLACE_BLOCKET_QUERY_SORT,
        SettingKey.BLOCKET_QUERY_SORT,
      ],
    },
    TRADERA: {
      maxRetries: [],
      retryDelay: [],
      timeout: [],
      limit: [],
      sort: [],
    },
  };

  const keys = settingsMap[marketplace];
  if (!keys) {
    throw new Error(`No settings configured for marketplace: ${marketplace}`);
  }

  const getSetting = (settingKeys: SettingKey[], defaultValue: string) => {
    for (const key of settingKeys) {
      const value = SettingRepository.getValue(key);
      if (value) return value;
    }
    return defaultValue;
  };

  return {
    maxRetries: parseInt(getSetting(keys.maxRetries, '5')),
    retryDelay: parseInt(getSetting(keys.retryDelay, '3000')),
    timeout: parseInt(getSetting(keys.timeout, '15000')),
    limit: parseInt(getSetting(keys.limit, '60')),
    sort: getSetting(keys.sort, 'rel'),
  };
}

/**
 * Fetches ads for a specific watcher using marketplace adapters
 */
async function fetchAdsForWatcher(watcher: Watcher): Promise<BaseAd[]> {
  const allAds: BaseAd[] = [];
  const adMap = new Map<string, BaseAd>(); // To avoid duplicates

  // Get all enabled queries for this watcher
  const queries = watcher.queries?.filter((q) => q.enabled !== false) || [];

  if (queries.length === 0) {
    logger.warn({
      message: 'No enabled queries found for watcher',
      watcherId: watcher.id,
    });
    return [];
  }

  for (const queryObj of queries) {
    try {
      // Determine marketplace for this query (with fallback to watcher default or BLOCKET)
      const marketplace =
        queryObj.marketplace || watcher.marketplace || 'BLOCKET';
      const adapter = getMarketplaceAdapter(marketplace);
      const settings = getMarketplaceSettings(marketplace);

      logger.debug({
        message: `Fetching ads for query: ${queryObj.query}`,
        watcherId: watcher.id,
        query: queryObj.query,
        marketplace,
      });

      // Build search query
      const searchQuery: SearchQuery = {
        query: queryObj.query,
        minPrice: watcher.min_price || undefined,
        maxPrice: watcher.max_price || undefined,
        filters: queryObj.filters,
      };

      // Build search config
      const searchConfig: SearchConfig = {
        limit: settings.limit,
        sort: settings.sort,
        timeout: settings.timeout,
      };

      // Search using marketplace adapter
      const result = await adapter.search(searchQuery, searchConfig);

      if (result.ads && Array.isArray(result.ads)) {
        // Add to map to avoid duplicates across marketplaces
        for (const ad of result.ads) {
          const key = `${ad.marketplace}:${ad.id}`;
          if (!adMap.has(key)) {
            adMap.set(key, ad);
          }
        }

        logger.debug({
          message: `Successfully fetched ${result.ads.length} ads for query`,
          watcherId: watcher.id,
          query: queryObj.query,
          marketplace,
          adsCount: result.ads.length,
        });
      } else {
        logger.debug({
          message: `No results for query`,
          watcherId: watcher.id,
          query: queryObj.query,
          marketplace,
        });
      }
    } catch (error) {
      logger.error({
        error: error as Error,
        message: `Failed to fetch ads for query after retries`,
        watcherId: watcher.id,
        query: queryObj.query,
        marketplace: queryObj.marketplace || watcher.marketplace || 'BLOCKET',
      });
      // Continue with other queries even if one fails
    }
  }

  const totalAds = Array.from(adMap.values());
  logger.info({
    message: `Fetched total ${totalAds.length} unique ads for watcher`,
    watcherId: watcher.id,
    queriesCount: queries.length,
    totalAds: totalAds.length,
    marketplaces: [...new Set(totalAds.map((ad) => ad.marketplace))],
  });

  return totalAds;
}

/**
 * Creates a cron job function for a specific watcher
 */
function createWatcherJobFunction(watcher: Watcher): () => Promise<void> {
  return async (): Promise<void> => {
    try {
      logger.info({
        message: `Running watcher job: ${watcher.id}`,
        watcherId: watcher.id,
        schedule: watcher.schedule,
        queriesCount: watcher.queries?.length || 0,
      });

      // Emit watcher start event
      console.log('[DEBUG] Emitting JOB_STARTED event for watcher:', watcher.id);
      eventEmitter.emit(WatcherEvents.JOB_STARTED, watcher);

      // Fetch new ads
      const ads = await fetchAdsForWatcher(watcher);

      if (ads.length === 0) {
        logger.info({
          message: 'No ads found for watcher',
          watcherId: watcher.id,
        });
        console.log('[DEBUG] Emitting JOB_COMPLETED event for watcher:', watcher.id, 'with 0 new ads');
        eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, []);
        return;
      }

      // Filter out ads that are already in cache (new ads only)
      const newAds = ads.filter((ad) => {
        return !marketplaceCache.has(ad.marketplace, ad.id);
      });

      if (newAds.length === 0) {
        logger.info({
          message: 'No new ads found for watcher',
          watcherId: watcher.id,
          totalAds: ads.length,
        });
        console.log('[DEBUG] Emitting JOB_COMPLETED event for watcher:', watcher.id, 'with 0 new ads');
        eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, []);
        return;
      }

      // Add new ads to cache
      newAds.forEach((ad) => marketplaceCache.set(ad));

      logger.info({
        message: `Found ${newAds.length} new ads for watcher`,
        watcherId: watcher.id,
        newAds: newAds.length,
        totalAds: ads.length,
        marketplaces: [...new Set(newAds.map((ad) => ad.marketplace))],
      });

      // Send notifications about new ads
      await notifyAboutAds(newAds, watcher.notifications, {
        queries: watcher.queries?.map((q) => q.query) || [],
        id: watcher.id,
      });

      // Emit completion event
      eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, newAds);
    } catch (error) {
      logger.error({
        error: error as Error,
        message: 'Error running watcher job',
        watcherId: watcher.id,
      });

      // Emit error event
      eventEmitter.emit(WatcherEvents.JOB_ERROR, watcher, error as Error);
    }
  };
}

/**
 * Creates and starts a cron job for a watcher
 */
export function startWatcherJob(watcher: Watcher): void {
  if (!watcher.id) {
    throw new Error('Watcher must have an ID to start job');
  }

  // Stop existing job if any
  stopWatcherJob(watcher.id);

  try {
    const job = new CronJob(
      watcher.schedule,
      createWatcherJobFunction(watcher),
      null,
      false,
      'Europe/Stockholm',
    );

    watcherJobs.set(watcher.id, job);
    job.start();

    logger.info({
      message: 'Started watcher job',
      watcherId: watcher.id,
      schedule: watcher.schedule,
      nextRun: job.nextDate()?.toString() || null,
    });

    // Emit job started event
    eventEmitter.emit(WatcherEvents.JOB_STARTED, watcher);
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Failed to start watcher job',
      watcherId: watcher.id,
      schedule: watcher.schedule,
    });
    throw error;
  }
}

/**
 * Stops a running cron job for a watcher and cleans up resources
 */
export function stopWatcherJob(watcherId: string): void {
  const job = watcherJobs.get(watcherId);
  if (job) {
    job.stop();
    watcherJobs.delete(watcherId);

    logger.info({
      message: 'Stopped watcher job',
      watcherId,
    });

    // Clear marketplace cache for this watcher (optional)
    // Note: We're not clearing cache here as other watchers might be using the same ads
  }
}

/**
 * Gets all active watcher jobs
 */
export function getActiveWatcherJobs(): Map<string, CronJob> {
  return new Map(watcherJobs);
}

/**
 * Manually triggers a watcher job
 */
export async function triggerWatcherJob(watcher: Watcher): Promise<BaseAd[]> {
  if (!watcher.id) {
    throw new Error('Watcher must have an ID to trigger job');
  }

  logger.info({
    message: 'Manually triggering watcher job',
    watcherId: watcher.id,
  });

  const jobFunction = createWatcherJobFunction(watcher);

  // Get current ads before running job to return new ones
  const adsBefore = await fetchAdsForWatcher(watcher);
  const newAdsBefore = adsBefore.filter(
    (ad) => !marketplaceCache.has(ad.marketplace, ad.id),
  );

  await jobFunction();

  return newAdsBefore;
}

/**
 * Manually runs a watcher once without creating a scheduled job
 * @param watcher - The watcher to run
 * @returns Promise that resolves when the watcher run is complete
 */
export async function runWatcherManually(watcher: Watcher): Promise<void> {
  logger.info({
    message: 'Running watcher manually',
    watcherId: watcher.id,
  });

  const jobFunction = createWatcherJobFunction(watcher);
  await jobFunction();
}

/**
 * Gets the next scheduled run time for a watcher
 */
export function getNextRunTime(watcherId: string): Date | null {
  const job = watcherJobs.get(watcherId);
  return job ? job.nextDate()?.toJSDate() || null : null;
}

/**
 * Checks if a watcher job is currently running
 */
export function isWatcherJobRunning(watcherId: string): boolean {
  return watcherJobs.has(watcherId);
}

/**
 * Gets status information about all watcher jobs
 */
export function getWatcherJobsStatus() {
  const status = [];

  for (const [watcherId, job] of watcherJobs) {
    const nextDate = job.nextDate();
    const lastDate = job.lastDate();

    status.push({
      watcherId,
      running: true, // If job exists in map, it's considered running
      nextRun: nextDate
        ? nextDate.toJSDate
          ? nextDate.toJSDate().toISOString()
          : nextDate.toString()
        : null,
      lastRun: lastDate ? lastDate.toISOString() : null,
    });
  }

  return status;
}
