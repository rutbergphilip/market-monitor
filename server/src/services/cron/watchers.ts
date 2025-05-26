import { CronJob } from 'cron';
import client, { type BlocketAd } from 'blocket.js';
import logger from '@/integrations/logger';
import { notifyAboutAds } from '@/services/notification';
import { BLOCKET_QUERY } from '@/constants/cron';
import { SettingRepository } from '@/db/repositories';
import { SettingKey } from '@/types/settings';
import type { Watcher } from '@/types/watchers';
import eventEmitter, { WatcherEvents } from '@/events';

const watcherJobs = new Map<string, CronJob>();
const watcherCaches = new Map<string, Map<string, BlocketAd>>();

/**
 * Retry a function with exponential backoff specifically for API calls
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay between retries in milliseconds
 * @returns Result of the function or throws error after max retries
 */
async function withApiRetry<T>(
  fn: () => Promise<T>,
  maxRetries?: number,
  baseDelay?: number,
): Promise<T> {
  // Get retry settings from database
  const configuredMaxRetries = parseInt(
    SettingRepository.getValue(SettingKey.BLOCKET_API_MAX_RETRIES) || '5',
  );
  const configuredRetryDelay = parseInt(
    SettingRepository.getValue(SettingKey.BLOCKET_API_RETRY_DELAY) || '3000',
  );

  const finalMaxRetries = maxRetries ?? configuredMaxRetries;
  const finalBaseDelay = baseDelay ?? configuredRetryDelay;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < finalMaxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Enhanced error pattern matching for retryable errors
      const errorMessage = lastError.message.toLowerCase();
      const errorCause =
        (lastError as any)?.cause?.message?.toLowerCase() || '';

      const isRetryableError =
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection timeout') ||
        errorMessage.includes('connect timeout') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('und_err_connect_timeout') ||
        errorMessage.includes('connecttimeouterror') ||
        errorCause.includes('timeout') ||
        errorCause.includes('connection') ||
        lastError.name === 'FetchError' ||
        lastError.name === 'ConnectTimeoutError' ||
        (lastError as any)?.code === 'UND_ERR_CONNECT_TIMEOUT';

      if (!isRetryableError || attempt === finalMaxRetries - 1) {
        logger.error({
          message: `Blocket API call failed permanently after ${attempt + 1} attempts`,
          error: lastError.message,
          errorType: lastError.constructor.name,
          errorName: lastError.name,
          errorCode: (lastError as any)?.code,
          errorCause: (lastError as any)?.cause?.message,
          stack: lastError.stack,
          attempt: attempt + 1,
          maxRetries: finalMaxRetries,
          isRetryableError,
        });
        throw lastError;
      }

      // Calculate progressive delay with jitter
      const baseDelayMultiplier = Math.pow(1.8, attempt); // Slower exponential growth
      const jitter = 0.8 + Math.random() * 0.4; // 20% jitter
      const delay = Math.min(
        finalBaseDelay * baseDelayMultiplier * jitter,
        30000,
      ); // Cap at 30 seconds

      logger.warn({
        message: `Blocket API retry attempt ${attempt + 1}/${finalMaxRetries} failed, retrying in ${Math.round(delay)}ms`,
        error: lastError.message,
        errorType: lastError.constructor.name,
        errorName: lastError.name,
        errorCode: (lastError as any)?.code,
        errorCause: (lastError as any)?.cause?.message,
        attempt: attempt + 1,
        maxRetries: finalMaxRetries,
        retryDelayMs: Math.round(delay),
        isRetryableError,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw (
    lastError ||
    new Error('Blocket API operation failed after multiple retries')
  );
}

/**
 * Fetches Blocket data for a specific watcher with multiple queries support
 * @param watcher - The watcher to fetch ads for
 * @returns {Promise<BlocketAd[]>}
 */
async function fetchAdsForWatcher(watcher: Watcher): Promise<BlocketAd[]> {
  const allAds: BlocketAd[] = [];
  const adMap = new Map<string, BlocketAd>(); // To avoid duplicates

  // Get all queries for this watcher
  const queries =
    watcher.queries && watcher.queries.length > 0
      ? watcher.queries.filter((q) => q.enabled !== false)
      : [{ query: watcher.query, enabled: true }]; // Fallback to main query

  for (const queryObj of queries) {
    try {
      const queryConfig = { ...BLOCKET_QUERY, query: queryObj.query };

      // Use retry mechanism for API calls with enhanced timeout handling
      const ads = await withApiRetry(async () => {
        logger.debug({
          message: `Fetching ads for query: ${queryObj.query}`,
          watcherId: watcher.id,
          query: queryObj.query,
        });

        // Configure timeout for this specific call
        const apiTimeout = parseInt(
          SettingRepository.getValue(SettingKey.BLOCKET_API_TIMEOUT) || '15000',
        );

        // Create a timeout promise that will reject after the configured timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Blocket API request timed out after ${apiTimeout}ms for query: ${queryObj.query}`,
              ),
            );
          }, apiTimeout);
        });

        // Race between the API call and timeout
        const apiCallPromise = client.find(queryConfig);

        return await Promise.race([apiCallPromise, timeoutPromise]);
      });

      if (ads && Array.isArray(ads)) {
        // Add to map to avoid duplicates
        for (const ad of ads) {
          if (!adMap.has(ad.ad_id)) {
            adMap.set(ad.ad_id, ad);
          }
        }

        logger.debug({
          message: `Successfully fetched ${ads.length} ads for query`,
          watcherId: watcher.id,
          query: queryObj.query,
          adsCount: ads.length,
        });
      }
    } catch (error) {
      logger.error({
        error: error as Error,
        message: `Failed to fetch ads for query after retries`,
        watcherId: watcher.id,
        query: queryObj.query,
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
  });

  return totalAds;
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
        const queries =
          watcher.queries && watcher.queries.length > 0
            ? watcher.queries.map((q) => q.query)
            : [watcher.query];
        logger.warn({
          message: `No results for watcher queries`,
          watcherId: watcher.id,
          queries: queries,
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
        const queries =
          watcher.queries && watcher.queries.length > 0
            ? watcher.queries.map((q) => q.query)
            : [watcher.query];
        logger.info({
          message: `First run for watcher: cached ${filteredAds.length} existing ads (${ads.length - filteredAds.length} excluded by price range)`,
          watcherId: watcher.id,
          queries: queries,
          enabledQueries:
            watcher.queries?.filter((q) => q.enabled !== false).length || 1,
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
        const queries =
          watcher.queries && watcher.queries.length > 0
            ? watcher.queries.map((q) => q.query)
            : [watcher.query];
        const watcherInfo = {
          query: watcher.query, // Keep main query for backward compatibility
          queries: queries,
          id: watcher.id!,
        };

        await notifyAboutAds(newAds, watcher.notifications, watcherInfo);

        for (const ad of newAds) {
          cache.set(ad.ad_id, ad);
        }
      }

      const queries =
        watcher.queries && watcher.queries.length > 0
          ? watcher.queries.map((q) => q.query)
          : [watcher.query];
      logger.info({
        message: `Job completed for watcher: found ${newAds.length} new ads`,
        watcherId: watcher.id,
        queries: queries,
        enabledQueries:
          watcher.queries?.filter((q) => q.enabled !== false).length || 1,
        priceRange: {
          min: watcher.min_price,
          max: watcher.max_price,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const queries =
        watcher.queries && watcher.queries.length > 0
          ? watcher.queries.map((q) => q.query)
          : [watcher.query];
      logger.error({
        error: error as Error,
        message: `Error in watcher job`,
        watcherId: watcher.id,
        queries: queries,
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
