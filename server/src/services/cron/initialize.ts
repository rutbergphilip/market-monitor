import { WatcherRepository } from '@/db/repositories';
import { initializeWatcherJobs } from './watchers';
import logger from '@/integrations/logger';

/**
 * Initialize the cron system by loading active watchers from the database
 * and creating cron jobs for them
 */
export function initializeCronSystem(): void {
  try {
    const watchers = WatcherRepository.getAll();

    initializeWatcherJobs(watchers);

    logger.info({
      message: `Cron system initialized with ${watchers.filter((w) => w.status === 'active').length} active watchers`,
    });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Failed to initialize cron system',
    });
  }
}
