import { Request, Response } from 'express';
import * as UserRepository from '@/db/repositories/users';
import logger from '@/integrations/logger';

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
