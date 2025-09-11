import { Router } from 'express';
import { sseHandler } from '@/controllers/sse';
import logger from '@/integrations/logger';

const router = Router();

// SSE endpoint for real-time updates
router.get('/', (req, res) => {
  logger.info({
    message: '[SSE Route] SSE endpoint hit',
    method: req.method,
    url: req.url,
    userId: (req as any).userId,
    clientIp: req.ip,
    userAgent: req.headers['user-agent'],
    headers: Object.keys(req.headers),
    hasAuth: !!req.headers.authorization
  });
  
  // Pass to the SSE handler
  logger.info({ message: '[SSE Route] Delegating to SSE handler' });
  sseHandler(req, res);
});

export default router;