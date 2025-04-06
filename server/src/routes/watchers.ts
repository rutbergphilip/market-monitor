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
} from '../controllers/watchers';

const router = Router();

// CRUD operations for watchers
router.get('/', getAll);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);
router.get('/:id', getById);

// Start or stop a watcher
router.post('/:id/start', start);
router.post('/:id/stop', stop);

// Manually trigger a watcher
router.post('/:id/trigger', triggerWatcher);

export default router;
