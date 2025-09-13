export * from './auth';

// Export the SSE-enabled marketplace watchers as the default implementation
export {
  startWatcherJob,
  stopWatcherJob,
  getWatcherJobsStatus,
  getActiveWatcherJobs,
  getNextRunTime,
  isWatcherJobRunning,
  runWatcherManually,
  triggerWatcherJob,
} from './marketplace-watchers';

// Legacy watcher functions for backward compatibility (without SSE)
export {
  startWatcherJob as startLegacyWatcherJob,
  stopWatcherJob as stopLegacyWatcherJob,
  initializeWatcherJobs as initializeLegacyWatcherJobs,
  getActiveWatcherJobs as getActiveLegacyWatcherJobs,
  runWatcherManually as runLegacyWatcherManually,
} from './watchers';
