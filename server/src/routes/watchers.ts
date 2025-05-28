import { Router } from 'express';

import {
  getAll,
  getById,
  create,
  update,
  remove,
  start,
  stop,
  triggerWatcher,
  getMarketplaces,
  getMarketplaceInfo,
} from '../controllers/watchers';

const router = Router();

// Marketplace routes (before parameterized routes)
router.get('/marketplaces', getMarketplaces);
router.get('/marketplaces/:type', getMarketplaceInfo);

// Watcher CRUD routes
router.get('/', getAll);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);
router.get('/:id', getById);

// Watcher actions
router.post('/:id/start', start);
router.post('/:id/stop', stop);
router.post('/:id/trigger', triggerWatcher);

export default router;
