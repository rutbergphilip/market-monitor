import { Router } from 'express';

import healthRoutes from './health';
import notificationRoutes from './notifications';
import watcherRoutes from './watchers';
import settingsRoutes from './settings';
import authRoutes from './auth';
import { authenticateJWT } from '@/middlewares/security';

const router = Router();

// Public routes
router.use(healthRoutes);
router.use('/api/auth', authRoutes);

// Protected routes - require authentication
router.use(authenticateJWT); // Apply authentication middleware to all routes below
router.use(notificationRoutes);
router.use('/api', watcherRoutes);
router.use('/api/settings', settingsRoutes);

export default router;
