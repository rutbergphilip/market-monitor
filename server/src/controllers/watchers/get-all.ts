import { WatcherRepository } from '@/db/repositories';

import type { Request, Response } from 'express';

export async function getAll(req: Request, res: Response) {
  const watchers = WatcherRepository.getAll();

  res.json(watchers);
}
