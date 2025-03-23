import { Request, Response } from 'express';
import { Router } from 'express';

export function healthCheckHandler(req: Request, res: Response) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}

const router = Router();

router.get('/health', healthCheckHandler);

export default router;
