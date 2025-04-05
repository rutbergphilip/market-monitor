import { WatcherRepository } from '@/db/repositories';
import { stopWatcherJob } from '@/services/cron';
import logger from '@/integrations/logger';

import type { Request, Response } from 'express';

export async function remove(req: Request, res: Response) {
  const { id } = req.params;

  try {
    // First, stop the watcher's cron job
    stopWatcherJob(id);
    logger.info({
      message: 'Watcher job stopped during deletion',
      watcherId: id,
    });

    // Then delete the watcher from the database
    await WatcherRepository.remove(id);
    logger.info({
      message: 'Watcher deleted successfully',
      watcherId: id,
    });

    res.sendStatus(204);
  } catch (error) {
    logger.error({
      message: 'Failed to delete watcher',
      error: error as Error,
      watcherId: id,
    });
    res.status(500).json({ error: 'Failed to delete watcher' });
  }
}
