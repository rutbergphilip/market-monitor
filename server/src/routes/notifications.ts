import { Request, Response } from 'express';
import { Router } from 'express';
import { sendDiscordNotification } from '@/services/notification';

export async function testDiscordHandler(req: Request, res: Response) {
  try {
    const ads = req.body;
    await sendDiscordNotification(ads);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    res.status(500).json({
      status: 'error',
      message: (error as Error).message,
    });
  }
}

const router = Router();

router.post('/notifications/test/discord', testDiscordHandler);

export default router;
