import { WatcherRepository } from '@/db/repositories';

import type { Request, Response } from 'express';

export async function stop(req: Request, res: Response) {
  WatcherRepository.stop(req.params.id);

  res.sendStatus(204);
}
