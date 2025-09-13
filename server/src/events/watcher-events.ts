import emitter, { WatcherEvents } from '@/events';
import * as watcherRepository from '@/db/repositories/watchers';
import logger from '@/integrations/logger';
import { sendSSEEvent } from '@/services/sse-manager';
import type { WatcherStatusUpdateEvent } from '@/types/sse';
import type { Watcher } from '@/types/watchers';
import type { BaseAd } from '@/marketplaces/base';

/**
 * Initialize watcher event listeners
 */
export function initWatcherEvents(): void {
  console.log('[DEBUG] Initializing watcher event listeners');
  
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

  emitter.on(WatcherEvents.JOB_STARTED, (watcher: Watcher) => {
    console.log('[DEBUG] 🚀 JOB_STARTED event received for watcher:', watcher.id);
    try {
      if (watcher.id) {
        watcherRepository.updateLastRun(watcher.id);
      }
      
      const event: WatcherStatusUpdateEvent = {
        type: 'watcher:status_update',
        data: {
          watcherId: watcher.id || 'unknown',
          status: 'running',
          message: 'Watcher job started',
          lastRun: new Date().toISOString(),
          nextRun: undefined,
        },
      };

      console.log('[DEBUG] 📡 Sending SSE event for JOB_STARTED:', JSON.stringify(event, null, 2));
      sendSSEEvent(event);

      logger.info({
        message: '✅ Sent watcher started SSE event',
        watcherId: watcher.id,
        eventType: event.type,
      });
    } catch (error) {
      logger.error({
        error: error as Error,
        message: '❌ Failed to send watcher started SSE event',
        watcherId: watcher.id,
      });
    }
  });

  emitter.on(WatcherEvents.JOB_COMPLETED, (watcher: Watcher, newAds: BaseAd[]) => {
    console.log('[DEBUG] ✅ JOB_COMPLETED event received for watcher:', watcher.id, 'with', newAds.length, 'new ads');
    try {
      const event: WatcherStatusUpdateEvent = {
        type: 'watcher:status_update',
        data: {
          watcherId: watcher.id || 'unknown',
          status: 'idle',
          message: `Job completed. Found ${newAds.length} new ads`,
          lastRun: new Date().toISOString(),
          nextRun: undefined,
          newAdsCount: newAds.length,
        },
      };

      console.log('[DEBUG] 📡 Sending SSE event for JOB_COMPLETED:', JSON.stringify(event, null, 2));
      sendSSEEvent(event);

      logger.info({
        message: '✅ Sent watcher completed SSE event',
        watcherId: watcher.id,
        newAdsCount: newAds.length,
        eventType: event.type,
      });
    } catch (error) {
      logger.error({
        error: error as Error,
        message: '❌ Failed to send watcher completed SSE event',
        watcherId: watcher.id,
      });
    }
  });

  emitter.on(WatcherEvents.JOB_ERROR, (watcher: Watcher, error: Error) => {
    try {
      const event: WatcherStatusUpdateEvent = {
        type: 'watcher:status_update',
        data: {
          watcherId: watcher.id || 'unknown',
          status: 'error',
          message: `Job failed: ${error.message}`,
          lastRun: new Date().toISOString(),
          nextRun: undefined,
          error: error.message,
        },
      };

      sendSSEEvent(event);

      logger.debug({
        message: 'Sent watcher error SSE event',
        watcherId: watcher.id,
        error: error.message,
      });
    } catch (sseError) {
      logger.error({
        error: sseError as Error,
        message: 'Failed to send watcher error SSE event',
        watcherId: watcher.id,
      });
    }
  });
}

export default {
  initWatcherEvents,
};
