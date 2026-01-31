import { Request, Response } from 'express';
import { Router } from 'express';
import logger from '@/integrations/logger';
import { db } from '@/db';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: {
    connected: boolean;
    error?: string;
  };
  uptime: number;
}

export function healthCheckHandler(req: Request, res: Response) {
  logger.debug({
    message: 'Health check requested',
    clientIp: req.ip,
  });

  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
    },
    uptime: process.uptime(),
  };

  // Check database connectivity
  try {
    // Simple query to verify database connection
    const result = db.prepare('SELECT 1 as test').get() as { test: number };
    response.database.connected = result.test === 1;

    if (!response.database.connected) {
      response.status = 'unhealthy';
      response.database.error = 'Database query returned unexpected result';
    }
  } catch (error) {
    response.status = 'unhealthy';
    response.database.connected = false;
    response.database.error =
      error instanceof Error ? error.message : 'Unknown database error';

    logger.error({
      message: 'Health check failed: Database error',
      error: error as Error,
      clientIp: req.ip,
    });
  }

  const statusCode = response.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
}

const router = Router();

router.get('/', healthCheckHandler);

export default router;
