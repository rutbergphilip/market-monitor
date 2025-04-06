import { Request, Response } from 'express';
import { Router } from 'express';
import { sendDiscordNotification } from '@/services/notification';
import logger from '@/integrations/logger';

export async function testDiscordHandler(req: Request, res: Response) {
  try {
    const ads = req.body;
    logger.info({
      message: 'Testing Discord notification',
      adsCount: ads?.length || 0,
    });

    await sendDiscordNotification(ads);
    res.sendStatus(204);
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error sending test Discord notification',
    });

    res.status(500).json({
      status: 'error',
      message: (error as Error).message,
    });
  }
}

const router = Router();

router.post('/test/discord', testDiscordHandler);

export default router;
