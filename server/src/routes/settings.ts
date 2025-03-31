import express from 'express';
import * as SettingsController from '@/controllers/settings';
// import { securityMiddleware } from '@/middlewares/security';

const router = express.Router();

// Apply security middleware to all settings routes
// router.use(securityMiddleware);

// GET /api/settings - Get all settings
router.get('/', SettingsController.getAll);

// GET /api/settings/defaults - Get default settings
router.get('/defaults', SettingsController.getDefaults);

// GET /api/settings/:key - Get setting by key
// router.get('/:key', SettingsController.getByKey);

// PUT /api/settings/:key - Update setting by key
// router.put('/:key', SettingsController.update);

// POST /api/settings/reset - Reset all settings to default values
router.post('/reset', SettingsController.resetAllToDefaults);

export default router;
