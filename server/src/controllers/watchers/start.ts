import { WatcherRepository } from '@/db/repositories';

import type { Request, Response } from 'express';

export async function start(req: Request, res: Response) {
  WatcherRepository.start(req.params.id);

  res.sendStatus(204);
}
