import { Request, Response } from 'express';
import { RefreshTokenRepository } from '@/db/repositories';
import logger from '@/integrations/logger';

export function logout(req: Request, res: Response) {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const clientIp = req.ip || req.connection.remoteAddress || 'Unknown';
  // @ts-ignore - userId is added by authenticateJWT middleware
  const userId = req.userId;

  try {
    logger.info({
      message: 'Logout attempt started',
      userId,
      userAgent,
      clientIp,
    });

    // Get the refresh token from request or cookie
    const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;

    // If we have a refresh token, revoke it in the database
    if (refreshToken) {
      const tokenPreview = refreshToken.substring(0, 10) + '...';
      const revoked = RefreshTokenRepository.revokeToken(refreshToken);

      if (revoked) {
        logger.info({
          message: 'Refresh token revoked during logout',
          userId,
          tokenPreview,
          userAgent,
          clientIp,
        });
      } else {
        logger.warn({
          message:
            'Logout: Failed to revoke refresh token (may already be revoked)',
          userId,
          tokenPreview,
          userAgent,
          clientIp,
        });
      }
    } else {
      logger.info({
        message: 'Logout: No refresh token found to revoke',
        userId,
        userAgent,
        clientIp,
      });
    }

    // Clear the auth cookies
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');

    logger.info({
      message: 'Logout successful',
      userId,
      userAgent,
      clientIp,
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Logout error',
      userId,
      userAgent,
      clientIp,
    });
    res.status(500).json({ error: 'An error occurred during logout' });
  }
}
