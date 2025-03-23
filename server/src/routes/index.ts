import { Router } from 'express';

import healthRoutes from './health';
import notificationRoutes from './notifications';

const router = Router();

router.use(healthRoutes);
router.use(notificationRoutes);

export default router;
