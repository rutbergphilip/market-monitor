import { Request, Response } from 'express';
import * as UserRepository from '@/db/repositories/users';
import { RefreshTokenRepository } from '@/db/repositories';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/middlewares/security';
import logger from '@/integrations/logger';
import { db } from '@/db';
import { UserType } from '@/types/users';

// Login controller
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = await UserRepository.validateUser(username, password);

    if (!user) {
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
        message: 'Failed to store refresh token',
        userId: user.id,
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
    });
    res.status(500).json({ error: 'An error occurred during login' });
  }
}

// Register controller
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

// Get current user info
export function me(req: Request, res: Response) {
  try {
    // @ts-ignore - userId is added by the auth middleware
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = UserRepository.getById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error fetching user info',
    });
    res
      .status(500)
      .json({ error: 'An error occurred while fetching user info' });
  }
}

// Logout controller
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

// Refresh token controller
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
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Then check in the database if it's still valid (not revoked)
    const storedToken = RefreshTokenRepository.findValidToken(tokenToVerify);

    if (!storedToken) {
      res.status(401).json({ error: 'Invalid or revoked refresh token' });
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

// Update user profile
export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    // @ts-ignore - userId is added by the auth middleware
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { username, email, avatarUrl } = req.body;
    const updateData = {} as any;
    let needsUpdate = false;

    // Check which fields to update
    if (username !== undefined) {
      updateData.username = username;
      needsUpdate = true;
    }

    if (email !== undefined) {
      updateData.email = email;
      needsUpdate = true;
    }

    if (avatarUrl !== undefined) {
      // Validate URL format if provided
      if (avatarUrl && !isValidUrl(avatarUrl)) {
        res.status(400).json({ error: 'Invalid avatar URL format' });
        return;
      }
      updateData.avatarUrl = avatarUrl;
      needsUpdate = true;
    }

    if (!needsUpdate) {
      res.status(400).json({ error: 'No profile data to update' });
      return;
    }

    // Get the current user to check for existing values
    const currentUser = UserRepository.getById(userId);
    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update the user in the database
    const updatedUser = await updateUserProfile(userId, updateData);

    if (!updatedUser) {
      res.status(404).json({ error: 'Failed to update user profile' });
      return;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error updating user profile',
    });
    res.status(500).json({ error: 'An error occurred while updating profile' });
  }
}

// Helper function to update user profile
async function updateUserProfile(
  userId: string,
  updateData: any,
): Promise<UserType | null> {
  try {
    const now = new Date().toISOString();

    // Construct SET part of SQL based on provided fields
    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    Object.entries(updateData).forEach(([key, value]) => {
      updates.push(`${key} = ?`);
      params.push(value);
    });

    const stmt = db.prepare(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    params.push(userId);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      logger.warn({
        message: 'No user found to update profile',
        userId,
      });
      return null;
    }

    logger.info({
      message: 'User profile updated',
      userId,
      updatedFields: Object.keys(updateData),
    });

    return UserRepository.getById(userId);
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error updating user profile in database',
      userId,
    });
    throw error;
  }
}

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}
