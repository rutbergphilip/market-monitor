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
  logger.info({
    message: '[CRON DEBUG] Starting ad fetch for watcher',
    watcherId: watcher.id,
    timestamp: new Date().toISOString(),
    watcherDetails: {
      id: watcher.id,
      marketplace: watcher.marketplace,
      schedule: watcher.schedule,
      minPrice: watcher.min_price,
      maxPrice: watcher.max_price,
      queriesCount: watcher.queries?.length || 0,
    },
  });

  const allAds: BaseAd[] = [];
  const adMap = new Map<string, BaseAd>(); // To avoid duplicates

  // Get all enabled queries for this watcher
  const queries = watcher.queries?.filter((q) => q.enabled !== false) || [];

  logger.info({
    message: '[CRON DEBUG] Query filtering completed',
    watcherId: watcher.id,
    totalQueries: watcher.queries?.length || 0,
    enabledQueries: queries.length,
    disabledQueries: (watcher.queries?.length || 0) - queries.length,
    queries: queries.map(q => ({ query: q.query, marketplace: q.marketplace, enabled: q.enabled })),
  });

  if (queries.length === 0) {
    logger.warn({
      message: '[CRON DEBUG] No enabled queries found for watcher - exiting fetch',
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

      logger.info({
        message: '[CRON DEBUG] Processing search results',
        watcherId: watcher.id,
        query: queryObj.query,
        marketplace,
        resultType: typeof result,
        hasAds: !!result.ads,
        adsIsArray: Array.isArray(result.ads),
        adsLength: result.ads?.length || 0,
      });

      if (result.ads && Array.isArray(result.ads)) {
        logger.info({
          message: '[CRON DEBUG] Processing ads array',
          watcherId: watcher.id,
          query: queryObj.query,
          marketplace,
          adsCount: result.ads.length,
          adSample: result.ads.slice(0, 3).map(ad => ({
            id: ad.id,
            title: ad.title?.substring(0, 50) + '...',
            price: ad.price?.value,
            marketplace: ad.marketplace,
          })),
        });

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

        logger.info({
          message: '[CRON DEBUG] Ads deduplication completed',
          watcherId: watcher.id,
          query: queryObj.query,
          marketplace,
          totalAdsFromQuery: result.ads.length,
          newAdsAdded: newAdsForQuery,
          duplicatesSkipped: duplicateAdsForQuery,
          totalUniqueAdsNow: adMap.size,
        });

        logger.info({
          message: '[CRON DEBUG] Successfully fetched ads for query',
          watcherId: watcher.id,
          query: queryObj.query,
          marketplace,
          adsCount: result.ads.length,
          newUniqueAds: newAdsForQuery,
        });
      } else {
        logger.info({
          message: '[CRON DEBUG] No results for query',
          watcherId: watcher.id,
          query: queryObj.query,
          marketplace,
          resultDetails: {
            ads: result.ads,
            hasMore: result.hasMore,
            totalCount: result.totalCount,
          },
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
    logger.info({
      message: '[CRON DEBUG] ===== CRON JOB EXECUTION STARTED =====',
      watcherId: watcher.id,
      timestamp: new Date().toISOString(),
      cronExecutionId: `${watcher.id}-${Date.now()}`,
      watcherSnapshot: {
        id: watcher.id,
        schedule: watcher.schedule,
        marketplace: watcher.marketplace,
        queriesCount: watcher.queries?.length || 0,
        notificationsCount: watcher.notifications?.length || 0,
        priceRange: {
          min: watcher.min_price,
          max: watcher.max_price,
        },
      },
    });

    try {
      logger.info({
        message: '[CRON DEBUG] Initializing watcher job execution',
        watcherId: watcher.id,
        schedule: watcher.schedule,
        queriesCount: watcher.queries?.length || 0,
      });

      logger.info({
        message: '[CRON DEBUG] Emitting JOB_STARTED event',
        watcherId: watcher.id,
      });

      // Emit watcher start event
      eventEmitter.emit(WatcherEvents.JOB_STARTED, watcher);

      logger.info({
        message: '[CRON DEBUG] Starting ad fetch process',
        watcherId: watcher.id,
      });

      // Fetch new ads
      const ads = await fetchAdsForWatcher(watcher);

      logger.info({
        message: '[CRON DEBUG] Ad fetch completed',
        watcherId: watcher.id,
        totalAdsFound: ads.length,
        adsByMarketplace: ads.reduce((acc, ad) => {
          acc[ad.marketplace] = (acc[ad.marketplace] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      });

      if (ads.length === 0) {
        logger.info({
          message: '[CRON DEBUG] No ads found for watcher - completing job',
          watcherId: watcher.id,
          timestamp: new Date().toISOString(),
        });
        eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, []);
        return;
      }

      logger.info({
        message: '[CRON DEBUG] Starting cache filtering process',
        watcherId: watcher.id,
        totalAdsToCheck: ads.length,
        cacheInfo: {
          cacheSize: marketplaceCache.size,
          cacheStats: marketplaceCache.getStats(),
        },
      });

      // Filter out ads that are already in cache (new ads only)
      const newAds = ads.filter((ad) => {
        const isInCache = marketplaceCache.has(ad.marketplace, ad.id);
        if (isInCache) {
          logger.debug({
            message: '[CRON DEBUG] Ad found in cache, skipping',
            watcherId: watcher.id,
            adId: ad.id,
            adTitle: ad.title?.substring(0, 50),
            marketplace: ad.marketplace,
          });
        }
        return !isInCache;
      });

      logger.info({
        message: '[CRON DEBUG] Cache filtering completed',
        watcherId: watcher.id,
        totalAds: ads.length,
        newAds: newAds.length,
        cachedAds: ads.length - newAds.length,
        newAdSample: newAds.slice(0, 3).map(ad => ({
          id: ad.id,
          title: ad.title?.substring(0, 50),
          price: ad.price?.value,
          marketplace: ad.marketplace,
        })),
      });

      if (newAds.length === 0) {
        logger.info({
          message: '[CRON DEBUG] No new ads found for watcher - completing job',
          watcherId: watcher.id,
          totalAds: ads.length,
          timestamp: new Date().toISOString(),
        });
        eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, []);
        return;
      }

      logger.info({
        message: '[CRON DEBUG] Adding new ads to cache',
        watcherId: watcher.id,
        newAdsCount: newAds.length,
      });

      // Add new ads to cache
      newAds.forEach((ad) => {
        logger.debug({
          message: '[CRON DEBUG] Adding ad to cache',
          watcherId: watcher.id,
          adId: ad.id,
          marketplace: ad.marketplace,
        });
        marketplaceCache.set(ad);
      });

      logger.info({
        message: '[CRON DEBUG] Found new ads for watcher',
        watcherId: watcher.id,
        newAds: newAds.length,
        totalAds: ads.length,
        marketplaces: [...new Set(newAds.map((ad) => ad.marketplace))],
        newCacheSize: marketplaceCache.size,
      });

      logger.info({
        message: '[CRON DEBUG] Starting notification process',
        watcherId: watcher.id,
        newAdsCount: newAds.length,
        notificationsCount: watcher.notifications?.length || 0,
        notifications: watcher.notifications?.map(n => ({ kind: n.kind })) || [],
      });

      try {
        // Send notifications about new ads
        await notifyAboutAds(newAds, watcher.notifications, {
          queries: watcher.queries?.map((q) => q.query) || [],
          id: watcher.id,
        });

        logger.info({
          message: '[CRON DEBUG] Notifications sent successfully',
          watcherId: watcher.id,
          newAdsCount: newAds.length,
        });
      } catch (notificationError) {
        logger.error({
          message: '[CRON DEBUG] Failed to send notifications',
          watcherId: watcher.id,
          newAdsCount: newAds.length,
          error: {
            message: notificationError instanceof Error ? notificationError.message : String(notificationError),
            stack: notificationError instanceof Error ? notificationError.stack : undefined,
          },
        });
        // Don't throw here - we still want to complete the job even if notifications fail
      }

      logger.info({
        message: '[CRON DEBUG] Emitting JOB_COMPLETED event',
        watcherId: watcher.id,
        newAdsCount: newAds.length,
      });

      // Emit completion event
      eventEmitter.emit(WatcherEvents.JOB_COMPLETED, watcher, newAds);

      logger.info({
        message: '[CRON DEBUG] ===== CRON JOB EXECUTION COMPLETED SUCCESSFULLY =====',
        watcherId: watcher.id,
        timestamp: new Date().toISOString(),
        summary: {
          totalAdsFound: ads.length,
          newAdsFound: newAds.length,
          notificationsSent: watcher.notifications?.length || 0,
        },
      });
    } catch (error) {
      logger.error({
        message: '[CRON DEBUG] ===== CRON JOB EXECUTION FAILED =====',
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

      logger.info({
        message: '[CRON DEBUG] Emitting JOB_ERROR event',
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
