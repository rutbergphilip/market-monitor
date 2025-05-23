import { Request, Response } from 'express';
import * as UserRepository from '@/db/repositories/users';
import logger from '@/integrations/logger';
import { db } from '@/db';
import { UserType } from '@/types/users';

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

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}
