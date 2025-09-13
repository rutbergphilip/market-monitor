import { WatcherRepository } from '@/db/repositories';
import { startWatcherJob, stopWatcherJob, getActiveWatcherJobs } from './marketplace-watchers';
import { refreshTokenCleanupJob } from './auth';
import logger from '@/integrations/logger';

/**
 * Initialize the cron system by loading active watchers from the database
 * and creating cron jobs for them using the SSE-enabled marketplace watchers
 */
export function initializeCronSystem(): void {
  try {
    // Stop any existing jobs first
    const activeJobs = getActiveWatcherJobs();
    for (const [watcherId] of activeJobs) {
      stopWatcherJob(watcherId);
    }

    // Initialize watcher jobs using the SSE-enabled implementation
    const watchers = WatcherRepository.getAll();
    const activeWatchers = watchers.filter((w) => w.status === 'active');
    
    for (const watcher of activeWatchers) {
      if (watcher.id) {
        startWatcherJob(watcher);
      }
    }

    // Start the refresh token cleanup job
    refreshTokenCleanupJob.start();

    logger.info({
      message: `Cron system initialized with ${activeWatchers.length} active watchers using SSE-enabled implementation and token cleanup job`,
    });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Failed to initialize cron system',
    });
  }
}
