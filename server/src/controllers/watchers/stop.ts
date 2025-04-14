import { WatcherRepository } from '@/db/repositories';
import { stopWatcherJob } from '@/services/cron';

import type { Request, Response } from 'express';

export async function stop(req: Request, res: Response) {
  const watcher = WatcherRepository.stop(req.params.id);

  if (watcher) {
    // Stop the watcher's cron job
    stopWatcherJob(watcher.id!);
  }

  res.sendStatus(204);
}
