import express from 'express';
import {
  getAll,
  getByKey,
  update,
  resetAllToDefaults,
  getDefaults,
} from '@/controllers/settings';

const router = express.Router();

// GET /api/settings - Get all settings
router.get('/', getAll);

// GET /api/settings/defaults - Get default settings
router.get('/defaults', getDefaults);

// GET /api/settings/:key - Get setting by key
router.get('/:key', getByKey);

// PATCH /api/settings/:key - Update setting by key
router.patch('/:key', update);

// POST /api/settings/reset - Reset all settings to default values
router.post('/reset', resetAllToDefaults);

export default router;
