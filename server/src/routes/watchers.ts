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

router.get('/', getAll);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);
router.get('/:id', getById);

router.post('/:id/start', start);
router.post('/:id/stop', stop);

router.post('/:id/trigger', triggerWatcher);

export default router;
