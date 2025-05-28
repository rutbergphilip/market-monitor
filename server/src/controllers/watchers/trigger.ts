import { Request, Response } from 'express';
import logger from '@/integrations/logger';
import { runMarketplaceWatcherManually } from '@/services/cron';
import { getById } from '@/db/repositories/watchers';

/**
 * Manually trigger a watcher to run once immediately
 * @param req Request
 * @param res Response
 */
export async function triggerWatcher(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Fetch the watcher to ensure it exists
    const watcher = getById(id);

    if (!watcher) {
      res.status(404).json({ error: 'Watcher not found' });
      return;
    }

    // Run the watcher manually
    await runMarketplaceWatcherManually(watcher);

    res.json({
      success: true,
      message: `Watcher triggered successfully`,
      watcherId: id,
    });
  } catch (error) {
    logger.error({
      message: 'Error triggering watcher',
      error: error as Error,
      watcherId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to trigger watcher' });
  }
}
