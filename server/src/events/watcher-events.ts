import emitter, { WatcherEvents } from '@/events';
import * as watcherRepository from '@/db/repositories/watchers';
import logger from '@/integrations/logger';

/**
 * Initialize watcher event listeners
 */
export function initWatcherEvents(): void {
  emitter.on(WatcherEvents.RUN, (watcherId: string) => {
    try {
      watcherRepository.incrementRunCount(watcherId);
      watcherRepository.updateLastRun(watcherId);

      logger.debug({
        message: 'Updated watcher run statistics',
        watcherId,
      });
    } catch (error) {
      logger.error({
        error: error as Error,
        message: 'Failed to update watcher run statistics',
        watcherId,
      });
    }
  });
}

export default {
  initWatcherEvents,
};
