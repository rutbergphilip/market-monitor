import { Request, Response } from 'express';
import { RefreshTokenRepository } from '@/db/repositories';
import logger from '@/integrations/logger';

export function logout(req: Request, res: Response) {
  try {
    // Get the refresh token from request or cookie
    const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;

    // If we have a refresh token, revoke it in the database
    if (refreshToken) {
      RefreshTokenRepository.revokeToken(refreshToken);
    }

    // Clear the auth cookies
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Logout error',
    });
    res.status(500).json({ error: 'An error occurred during logout' });
  }
}
