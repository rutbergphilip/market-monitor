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
router.get('/watchers', getAll);
router.post('/watchers', create);
router.patch('/watchers/:id', update);
router.delete('/watchers/:id', remove);
router.get('/watchers/:id', getById);

// Start or stop a watcher
router.post('/watchers/:id/start', start);
router.post('/watchers/:id/stop', stop);

// Manually trigger a watcher
router.post('/watchers/:id/trigger', triggerWatcher);

export default router;
