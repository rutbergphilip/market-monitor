import { Router } from 'express';

import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../controllers/watchers';

const router = Router();

router.get('/api/watchers', getAll);
router.post('/api/watchers', create);
router.patch('/api/watchers/:id', update);
router.delete('/api/watchers/:id', remove);
router.get('/api/watchers/:id', getById);

export default router;
