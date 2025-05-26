import { Request, Response } from 'express';
import * as UserRepository from '@/db/repositories/users';
import { RefreshTokenRepository } from '@/db/repositories';
import { generateToken, generateRefreshToken } from '@/middlewares/security';
import logger from '@/integrations/logger';

export async function register(req: Request, res: Response) {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const clientIp = req.ip || req.connection.remoteAddress || 'Unknown';

  try {
    const { username, email, password } = req.body;

    logger.info({
      message: 'Registration attempt started',
      username,
      email,
      userAgent,
      clientIp,
    });

    if (!username || !password) {
      logger.warn({
        message: 'Registration failed: Missing required fields',
        username,
        email,
        userAgent,
        clientIp,
      });
      res.status(400).json({
        error: 'Username and password are required',
      });
      return;
    }

    try {
      const newUser = await UserRepository.create({
        username,
        email,
        password,
      });

      // Generate token for new user
      const token = generateToken(newUser.id);

      // Generate refresh token
      const refreshTokenValue = generateRefreshToken(newUser.id);

      // Store refresh token in database
      const storedToken = RefreshTokenRepository.createRefreshToken(
        newUser.id,
        refreshTokenValue,
      );

      if (!storedToken) {
        logger.error({
          message:
            'Registration failed: Failed to store refresh token for new user',
          userId: newUser.id,
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
        message: 'Registration successful',
        userId: newUser.id,
        username,
        email,
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

      res.status(201).json({
        user: newUser,
        token,
        refreshToken: refreshTokenValue,
      });
    } catch (error) {
      // Handle duplicate username or email
      if ((error as Error).message.includes('already exists')) {
        logger.warn({
          message: 'Registration failed: Username or email already exists',
          username,
          email,
          error: (error as Error).message,
          userAgent,
          clientIp,
        });
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      throw error;
    }
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Register error',
      username: req.body?.username,
      email: req.body?.email,
      userAgent,
      clientIp,
    });
    res.status(500).json({ error: 'An error occurred during registration' });
  }
}
