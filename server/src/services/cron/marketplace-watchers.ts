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
const watcherFirstRun = new Map<string, boolean>();

/**
 * Get marketplace settings with fallback to legacy settings
 */
function getMarketplaceSettings(marketplace: MarketplaceType) {
  // Normalize marketplace type to uppercase to handle case mismatches
  const normalizedMarketplace = marketplace.toUpperCase() as MarketplaceType;

  logger.debug({
    message: 'Getting marketplace settings',
    originalMarketplace: marketplace,
    normalizedMarketplace,
  });

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

  const keys = settingsMap[normalizedMarketplace];
  if (!keys) {
    throw new Error(`No settings configured for marketplace: ${normalizedMarketplace}`);
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
      watcherId: watcher.id,
      allQueries: watcher.queries?.map(q => ({ query: q.query, enabled: q.enabled })) || [],
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

        let newAdsForQuery = 0;
        let duplicateAdsForQuery = 0;

        // Add to map to avoid duplicates across marketplaces
        for (const ad of result.ads) {
          const key = `${ad.marketplace}:${ad.id}`;
          if (!adMap.has(key)) {
            adMap.set(key, ad);
            newAdsForQuery++;
          } else {
            duplicateAdsForQuery++;
          }
        }


      } else {
      }
    } catch (error) {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: (error as any)?.code,
        cause: (error as any)?.cause,
      } : {
        raw: String(error),
        type: typeof error,
      };

      logger.error({
        watcherId: watcher.id,
        query: queryObj.query,
        marketplace: queryObj.marketplace || watcher.marketplace || 'BLOCKET',
        timestamp: new Date().toISOString(),
        errorDetails,
        searchQuery: {
          query: queryObj.query,
          minPrice: watcher.min_price,
          maxPrice: watcher.max_price,
          filters: queryObj.filters,
        },
        searchConfig: {
          limit: 20,
          sort: 'date_desc',
          timeout: 30000,
        },
      });
      // Continue with other queries even if one fails
    }
  }

  const totalAds = Array.from(adMap.values());

  return totalAds;
}

/**
 * Creates a cron job function for a specific watcher
 */
function createWatcherJobFunction(watcher: Watcher): () => Promise<void> {
  return async (): Promise<void> => {
    if (!watcher.id) {
      throw new Error('Watcher must have an ID to execute job');
    }

    try {
      // Check if this is the first run for this watcher
      const isFirstRun = watcherFirstRun.get(watcher.id) !== false;

      // Emit watcher start event
      eventEmitter.emit(WatcherEvents.JOB_STARTED, watcher);

      logger.debug({
        message: `Watcher job starting`,
        watcherId: watcher.id,
        isFirstRun,
        queriesCount: watcher.queries?.length || 0,
      });


      // Fetch new ads
      const ads = await fetchAdsForWatcher(watcher);

      if (ads.length === 0) {
        if (isFirstRun) {
          watcherFirstRun.set(watcher.id, false);
          logger.info({
            message: `First run completed for watcher: no ads found`,
            watcherId: watcher.id,
            queries: watcher.queries?.map((q) => q.query) || [],
          });
        }
        eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, []);
        return;
      }

      if (isFirstRun) {
        // First run: cache all existing ads without sending notifications
        ads.forEach((ad) => {
          marketplaceCache.set(ad);
        });

        watcherFirstRun.set(watcher.id, false);

        logger.info({
          message: `First run completed for watcher: cached ${ads.length} existing ads without notifications`,
          watcherId: watcher.id,
          queries: watcher.queries?.map((q) => q.query) || [],
          cachedAdsCount: ads.length,
        });

        eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, []);
        return;
      }

      // Subsequent runs: filter out ads that are already in cache (new ads only)
      const newAds = ads.filter((ad) => {
        const isInCache = marketplaceCache.has(ad.marketplace, ad.id);
        if (isInCache) {
          logger.debug({
            message: `Ad already in cache, skipping`,
            watcherId: watcher.id,
            adId: ad.id,
            adTitle: ad.title?.substring(0, 50),
            marketplace: ad.marketplace,
          });
        }
        return !isInCache;
      });

      if (newAds.length === 0) {
        logger.debug({
          message: `No new ads found for watcher`,
          watcherId: watcher.id,
          totalAdsFound: ads.length,
          queries: watcher.queries?.map((q) => q.query) || [],
        });
        eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, []);
        return;
      }

      // Add new ads to cache
      newAds.forEach((ad) => {
        logger.debug({
          message: `Adding new ad to cache`,
          watcherId: watcher.id,
          adId: ad.id,
          adTitle: ad.title?.substring(0, 50),
          marketplace: ad.marketplace,
        });
        marketplaceCache.set(ad);
      });

      logger.info({
        message: `Found ${newAds.length} new ads for watcher`,
        watcherId: watcher.id,
        newAdsCount: newAds.length,
        totalAdsFound: ads.length,
        queries: watcher.queries?.map((q) => q.query) || [],
      });



      try {
        // Send notifications about new ads
        await notifyAboutAds(newAds, watcher.notifications, {
          queries: watcher.queries?.map((q) => q.query) || [],
          id: watcher.id,
        });

      } catch (notificationError) {
        logger.error({
          message: `Failed to send notifications for new ads`,
          watcherId: watcher.id,
          newAdsCount: newAds.length,
          error: {
            message: notificationError instanceof Error ? notificationError.message : String(notificationError),
            stack: notificationError instanceof Error ? notificationError.stack : undefined,
          },
        });
        // Don't throw here - we still want to complete the job even if notifications fail
      }


      // Emit completion event
      eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, newAds);

    } catch (error) {
      logger.error({
        watcherId: watcher.id,
        timestamp: new Date().toISOString(),
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
          code: (error as any)?.code,
          cause: (error as any)?.cause,
        },
        watcherSnapshot: {
          id: watcher.id,
          schedule: watcher.schedule,
          marketplace: watcher.marketplace,
          queriesCount: watcher.queries?.length || 0,
        },
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

  // Initialize first-run tracking for this watcher
  watcherFirstRun.set(watcher.id, true);

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

    logger.debug({
      message: `Started watcher job with first-run tracking`,
      watcherId: watcher.id,
      schedule: watcher.schedule,
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

    // Clear first-run tracking for this watcher
    watcherFirstRun.delete(watcherId);

    logger.debug({
      message: `Stopped watcher job and cleaned up tracking`,
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
  if (!watcher.id) {
    throw new Error('Watcher must have an ID to run manually');
  }

  logger.info({
    message: `Manually running watcher`,
    watcherId: watcher.id,
    queries: watcher.queries?.map((q) => q.query) || [],
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
