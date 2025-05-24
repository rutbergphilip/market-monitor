import { Request, Response } from 'express';
import { RefreshTokenRepository } from '@/db/repositories';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/middlewares/security';
import logger from '@/integrations/logger';

export function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    // Check if refresh token is provided
    if (!refreshToken) {
      // Try to get from cookie
      const cookieRefreshToken = req.cookies?.refresh_token;
      if (!cookieRefreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }
    }

    // Get the token from request or cookie
    const tokenToVerify = refreshToken || req.cookies?.refresh_token;

    // First verify the JWT signature validity
    const decoded = verifyRefreshToken(tokenToVerify);

    if (!decoded) {
      res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
      return;
    }

    // Then check in the database if it's still valid (not revoked)
    const storedToken = RefreshTokenRepository.findValidToken(tokenToVerify);

    if (!storedToken) {
      res.status(401).json({
        error: 'Invalid or revoked refresh token',
        code: 'REVOKED_REFRESH_TOKEN',
      });
      return;
    }

    // Revoke the current refresh token for security
    RefreshTokenRepository.revokeToken(tokenToVerify);

    // Generate new access token
    const newToken = generateToken(decoded.userId);

    // Generate new refresh token (rotate refresh tokens for better security)
    const newRefreshTokenValue = generateRefreshToken(decoded.userId);

    // Store the new refresh token
    RefreshTokenRepository.createRefreshToken(
      decoded.userId,
      newRefreshTokenValue,
    );

    // Set new cookies
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie('refresh_token', newRefreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      token: newToken,
      refreshToken: newRefreshTokenValue,
    });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Token refresh error',
    });
    res
      .status(500)
      .json({ error: 'An error occurred while refreshing the token' });
  }
}
