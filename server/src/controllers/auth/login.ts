import { Request, Response } from 'express';
import * as UserRepository from '@/db/repositories/users';
import { RefreshTokenRepository } from '@/db/repositories';
import { generateToken, generateRefreshToken } from '@/middlewares/security';
import logger from '@/integrations/logger';

export async function login(req: Request, res: Response) {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const clientIp = req.ip || req.connection.remoteAddress || 'Unknown';

  try {
    const { username, password } = req.body;

    logger.info({
      message: 'Login attempt started',
      username,
      userAgent,
      clientIp,
    });

    if (!username || !password) {
      logger.warn({
        message: 'Login failed: Missing credentials',
        username,
        userAgent,
        clientIp,
      });
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = await UserRepository.validateUser(username, password);

    if (!user) {
      logger.warn({
        message: 'Login failed: Invalid credentials',
        username,
        userAgent,
        clientIp,
      });
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Generate refresh token
    const refreshTokenValue = generateRefreshToken(user.id);

    // Store refresh token in database
    const storedToken = RefreshTokenRepository.createRefreshToken(
      user.id,
      refreshTokenValue,
    );

    if (!storedToken) {
      logger.error({
        message: 'Login failed: Failed to store refresh token',
        userId: user.id,
        username,
        userAgent,
        clientIp,
      });
      res
        .status(500)
        .json({ error: 'Failed to create authentication session' });
      return;
    }

    logger.info({
      message: 'Login successful',
      userId: user.id,
      username,
      refreshTokenId: storedToken.id,
      userAgent,
      clientIp,
    });

    // Set cookies for browser clients
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie('refresh_token', refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
      refreshToken: refreshTokenValue,
    });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Login error',
      username: req.body?.username,
      userAgent,
      clientIp,
    });
    res.status(500).json({ error: 'An error occurred during login' });
  }
}
