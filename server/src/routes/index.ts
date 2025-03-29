import { Router } from 'express';

import healthRoutes from './health';
import notificationRoutes from './notifications';
import watcherRoutes from './watchers';

const router = Router();

router.use(healthRoutes);
router.use(notificationRoutes);
router.use(watcherRoutes);

export default router;
