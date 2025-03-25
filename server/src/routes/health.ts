import { Request, Response } from 'express';
import { Router } from 'express';
import logger from '@/integrations/logger';

export function healthCheckHandler(req: Request, res: Response) {
  logger.debug({
    message: 'Health check requested',
    clientIp: req.ip
  });
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}

const router = Router();

router.get('/health', healthCheckHandler);

export default router;
