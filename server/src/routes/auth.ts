import express from 'express';
import * as AuthController from '@/controllers/auth';
import { authenticateJWT } from '@/middlewares/security';

const router = express.Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/logout', AuthController.logout);

// Protected routes
router.get('/me', authenticateJWT, AuthController.me);
router.put('/profile', authenticateJWT, AuthController.updateProfile);

export default router;
