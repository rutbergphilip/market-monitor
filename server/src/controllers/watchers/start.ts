import { WatcherRepository } from '@/db/repositories';
import { startWatcherJob } from '@/services/cron';

import type { Request, Response } from 'express';

export async function start(req: Request, res: Response) {
  const watcher = WatcherRepository.start(req.params.id);

  if (watcher) {
    // Start the watcher's cron job
    startWatcherJob(watcher);
  }

  res.sendStatus(204);
}
