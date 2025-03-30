import { WatcherRepository } from '@/db/repositories';
import { startWatcherJob } from '@/services/cron';

import type { Watcher } from '@/types/watchers';
import type { Request, Response } from 'express';

export async function create(req: Request, res: Response) {
  const { query, schedule, notifications } = req.body;

  const newWatcher: Watcher = {
    last_run: new Date().toISOString(),
    status: 'active',
    number_of_runs: 0,
    query,
    notifications,
    schedule,
  };

  const watcher = WatcherRepository.create(newWatcher);

  // Start the cron job for this new watcher since it's created as active
  if (watcher.id && watcher.status === 'active') {
    startWatcherJob(watcher);
  }

  res.status(201).json(watcher);
}
