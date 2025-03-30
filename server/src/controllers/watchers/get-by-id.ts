import { WatcherRepository } from '@/db/repositories';

import type { Request, Response } from 'express';

export async function getById(req: Request, res: Response) {
  const watcher = WatcherRepository.getById(req.params.id);

  if (!watcher) {
    res.status(404).json({ message: 'Watcher not found' });
  } else {
    res.json(watcher);
  }
}
