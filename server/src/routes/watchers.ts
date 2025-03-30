import { Router } from 'express';

import {
  getAll,
  getById,
  create,
  update,
  remove,
  start,
  stop,
} from '../controllers/watchers';

const router = Router();

// CRUD operations for watchers
router.get('/api/watchers', getAll);
router.post('/api/watchers', create);
router.patch('/api/watchers/:id', update);
router.delete('/api/watchers/:id', remove);
router.get('/api/watchers/:id', getById);

// Start or stop a watcher
router.post('/api/watchers/:id/start', start);
router.post('/api/watchers/:id/stop', stop);

export default router;
