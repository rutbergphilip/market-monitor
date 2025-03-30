import { WatcherRepository } from '@/db/repositories';
import { stopWatcherJob, startWatcherJob } from '@/services/cron';

import type { Request, Response } from 'express';
import type { Watcher } from '@/types/watchers';

export async function update(req: Request, res: Response) {
  const { id } = req.params;
  const { query, schedule, notifications } = req.body;

  // Get the original watcher before updating
  const originalWatcher = WatcherRepository.getById(id);
  const scheduleChanged =
    originalWatcher && schedule && originalWatcher.schedule !== schedule;

  const updatedWatcher: Watcher = {
    query,
    notifications,
    schedule,
  };

  const watcher = WatcherRepository.update(id, updatedWatcher);

  if (!watcher) {
    res.status(404).json({ message: 'Watcher not found' });
  } else {
    // If this is an active watcher and the schedule changed, restart the cron job
    if (watcher.status === 'active' && scheduleChanged) {
      stopWatcherJob(id);
      startWatcherJob(watcher);
    }

    res.json(watcher);
  }
}
