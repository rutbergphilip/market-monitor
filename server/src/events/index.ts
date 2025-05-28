import { EventEmitter } from 'events';
import { initSettingsEvents } from './settings-events';
import { initWatcherEvents } from './watcher-events';

export const WatcherEvents = Object.freeze({
  RUN: 'watcher:run',
  JOB_STARTED: 'watcher:job:started',
  JOB_COMPLETED: 'watcher:job:completed',
  JOB_ERROR: 'watcher:job:error',
});

export const SettingsEvents = Object.freeze({
  UPDATED: 'settings:updated',
});

const emitter = new EventEmitter();

emitter.setMaxListeners(20);

export * from './watcher-events';
export * from './settings-events';

export function initEvents(): void {
  initWatcherEvents();
  initSettingsEvents();
}

// Export events
export default emitter;
