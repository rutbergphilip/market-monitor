import { Request, Response } from 'express';
import * as UserRepository from '@/db/repositories/users';
import { RefreshTokenRepository } from '@/db/repositories';
import { generateToken, generateRefreshToken } from '@/middlewares/security';
import logger from '@/integrations/logger';

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
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
          message: 'Failed to store refresh token for new user',
          userId: newUser.id,
        });
        res
          .status(500)
          .json({ error: 'Failed to create authentication session' });
        return;
      }

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
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      throw error;
    }
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Register error',
    });
    res.status(500).json({ error: 'An error occurred during registration' });
  }
}
