import { WatcherRepository } from '@/db/repositories';

import type { Request, Response } from 'express';
import type { Watcher } from '@/types/watchers';

export async function update(req: Request, res: Response) {
  const { id } = req.params;
  const { query, schedule, notifications } = req.body;

  const updatedWatcher: Watcher = {
    query,
    notifications,
    schedule,
  };

  const watcher = WatcherRepository.update(id, updatedWatcher);

  if (!watcher) {
    res.status(404).json({ message: 'Watcher not found' });
  } else {
    res.json(watcher);
  }
}
