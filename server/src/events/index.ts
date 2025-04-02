import { EventEmitter } from 'events';

export const WatcherEvents = Object.freeze({
  RUN: 'watcher:run',
});

const emitter = new EventEmitter();

emitter.setMaxListeners(20);

export default emitter;
