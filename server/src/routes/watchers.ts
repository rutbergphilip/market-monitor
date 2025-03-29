import { Router } from 'express';

import type { Request, Response } from 'express';
import type { Watcher } from '../types/watchers';

async function getWatchers(req: Request, res: Response) {
  const watchers: Watcher[] = [
    {
      id: '4600',
      last_run: '2024-03-11T15:30:00',
      status: 'active',
      number_of_runs: 5,
      query: 'Macbook Pro 16"',
      notifications: ['DISCORD'],
      schedule: '*/5 * * * *',
    },
  ];

  res.json(watchers);
}

const router = Router();

router.get('/api/watchers', getWatchers);

router.post('/api/watchers', async (req: Request, res: Response) => {
  const { query, schedule, notifications } = req.body;

  const newWatcher: Watcher = {
    id: Date.now().toString(),
    last_run: new Date().toISOString(),
    status: 'active',
    number_of_runs: 0,
    query,
    notifications,
    schedule,
  };

  res.status(201).json(newWatcher);
});

export default router;
