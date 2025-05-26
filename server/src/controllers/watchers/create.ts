import { WatcherRepository } from '@/db/repositories';
import { startWatcherJob } from '@/services/cron';

import type { Watcher } from '@/types/watchers';
import type { Request, Response } from 'express';

export async function create(req: Request, res: Response) {
  const { query, queries, schedule, notifications, min_price, max_price } =
    req.body;

  const newWatcher: Watcher = {
    last_run: new Date().toISOString(),
    status: 'active',
    query,
    queries,
    notifications,
    schedule,
    min_price: min_price || null,
    max_price: max_price || null,
  };

  const watcher = WatcherRepository.create(newWatcher);

  if (watcher.id && watcher.status === 'active') {
    startWatcherJob(watcher);
  }

  res.status(201).json(watcher);
}
