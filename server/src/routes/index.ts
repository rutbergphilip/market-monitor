import { Router } from 'express';

import healthRoutes from './health';
import notificationRoutes from './notifications';
import watcherRoutes from './watchers';
import settingsRoutes from './settings';
import authRoutes from './auth';
import sseRoutes from './sse';
import { authenticateJWT } from '@/middlewares/security';

const router = Router();

// Public routes
router.use('/api/health', healthRoutes);
router.use('/api/auth', authRoutes);

// Protected routes - require authentication
router.use(authenticateJWT); // Apply authentication middleware to all routes below
router.use('/api/notifications', notificationRoutes);
router.use('/api/watchers', watcherRoutes);
router.use('/api/settings', settingsRoutes);
router.use('/api/sse', sseRoutes);

export default router;
