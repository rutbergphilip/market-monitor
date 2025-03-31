import { Router } from 'express';

import healthRoutes from './health';
import notificationRoutes from './notifications';
import watcherRoutes from './watchers';
import settingsRoutes from './settings';

const router = Router();

router.use(healthRoutes);
router.use(notificationRoutes);
router.use(watcherRoutes);
router.use('/api/settings', settingsRoutes);

export default router;
