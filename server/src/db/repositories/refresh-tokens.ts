import { db } from '@/db';
import logger from '@/integrations/logger';
import { addDays } from 'date-fns';

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}

export function createRefreshToken(
  userId: string | number,
  token: string,
  expiresInDays = 30,
): RefreshToken | null {
  try {
    const expiresAt = addDays(new Date(), expiresInDays).toISOString();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(userId, token, expiresAt, now);

    if (result.lastInsertRowid) {
      logger.info({
        message: 'Refresh token created',
        userId,
        tokenId: result.lastInsertRowid,
      });

      return {
        id: Number(result.lastInsertRowid),
        user_id: Number(userId),
        token,
        expires_at: expiresAt,
        revoked: false,
        created_at: now,
      };
    }

    return null;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error creating refresh token',
      userId,
    });
    throw error;
  }
}

export function findValidToken(token: string): RefreshToken | null {
  try {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      SELECT * FROM refresh_tokens 
      WHERE token = ? 
      AND revoked = 0 
      AND expires_at > ?
    `);

    const refreshToken = stmt.get(token, now) as RefreshToken | undefined;
    return refreshToken || null;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error finding refresh token',
    });
    throw error;
  }
}

export function revokeToken(token: string): boolean {
  try {
    const stmt = db.prepare(`
      UPDATE refresh_tokens
      SET revoked = 1
      WHERE token = ?
    `);

    const result = stmt.run(token);

    if (result.changes > 0) {
      logger.info({
        message: 'Refresh token revoked',
        token: token.substring(0, 10) + '...',
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error revoking refresh token',
    });
    throw error;
  }
}

export function revokeAllUserTokens(userId: string | number): boolean {
  try {
    const stmt = db.prepare(`
      UPDATE refresh_tokens
      SET revoked = 1
      WHERE user_id = ?
    `);

    const result = stmt.run(userId);

    logger.info({
      message: 'Revoked all refresh tokens for user',
      userId,
      tokensRevoked: result.changes,
    });

    return result.changes > 0;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error revoking all user refresh tokens',
      userId,
    });
    throw error;
  }
}

export function cleanupTokens(): number {
  try {
    const now = new Date().toISOString();

    const expiredStmt = db.prepare(`
      DELETE FROM refresh_tokens
      WHERE expires_at < ?
    `);

    const expiredResult = expiredStmt.run(now);

    const oneDayAgo = addDays(new Date(), -1).toISOString();

    const revokedStmt = db.prepare(`
      DELETE FROM refresh_tokens
      WHERE revoked = 1 AND created_at < ?
    `);

    const revokedResult = revokedStmt.run(oneDayAgo);

    const totalDeleted = expiredResult.changes + revokedResult.changes;

    if (totalDeleted > 0) {
      logger.info({
        message: 'Cleaned up refresh tokens',
        expired: expiredResult.changes,
        revoked: revokedResult.changes,
        total: totalDeleted,
      });
    }

    return totalDeleted;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error cleaning up refresh tokens',
    });
    return 0;
  }
}
