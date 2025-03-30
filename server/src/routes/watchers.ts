import { Router } from 'express';

import { WatcherRepository } from '../db/repositories';

import type { Request, Response } from 'express';
import type { Watcher } from '../types/watchers';

async function getWatchers(req: Request, res: Response) {
  const watchers = WatcherRepository.getAll();

  res.json(watchers);
}

const router = Router();

router.get('/api/watchers', getWatchers);

router.post('/api/watchers', async (req: Request, res: Response) => {
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

  res.status(201).json(watcher);
});

export default router;
