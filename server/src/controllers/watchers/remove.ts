import { WatcherRepository } from '@/db/repositories';

import type { Request, Response } from 'express';

export async function remove(req: Request, res: Response) {
  WatcherRepository.remove(req.params.id);

  res.sendStatus(204);
}
