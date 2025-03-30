import { WatcherRepository } from '@/db/repositories';
import { stopWatcherJob } from '@/services/cron';

import type { Request, Response } from 'express';

export async function remove(req: Request, res: Response) {
  const { id } = req.params;

  // Stop the watcher's cron job before removing from database
  stopWatcherJob(id);

  // Delete the watcher from the database
  WatcherRepository.remove(id);

  res.sendStatus(204);
}
