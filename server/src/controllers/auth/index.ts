import { Request, Response } from 'express';
import { UserRepository } from '@/db/repositories';
import { generateToken } from '@/middlewares/security';
import logger from '@/integrations/logger';

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

    // Set cookie for browser clients
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
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

      // Set cookie for browser clients
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.status(201).json({
        user: newUser,
        token,
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
    // Clear the auth cookie
    res.clearCookie('auth_token');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Logout error',
    });
    res.status(500).json({ error: 'An error occurred during logout' });
  }
}
