import emitter, { WatcherEvents } from '@/events';
import * as watcherRepository from '@/db/repositories/watchers';
import logger from '@/integrations/logger';

/**
 * Initialize watcher event listeners
 */
export function initWatcherEvents(): void {
  emitter.on(WatcherEvents.RUN, (watcherId: string) => {
    try {
      watcherRepository.updateLastRun(watcherId);

      logger.debug({
        message: 'Updated watcher last run time',
        watcherId,
      });
    } catch (error) {
      logger.error({
        error: error as Error,
        message: 'Failed to update watcher last run time',
        watcherId,
      });
    }
  });
}

export default {
  initWatcherEvents,
};
