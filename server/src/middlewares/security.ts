import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '@/integrations/logger';
import { RefreshTokenRepository } from '@/db/repositories';

const JWT_SECRET = process.env.JWT_SECRET || 'blocket-bot-secret-key';
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'blocket-bot-refresh-secret-key';
const TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '30d';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn({
        message: 'JWT token expired',
        error: error.message,
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({
        message: 'Invalid JWT token',
        error: error.message,
      });
    } else {
      logger.warn({
        message: 'JWT verification failed',
        error: error as Error,
      });
    }
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as {
      userId: string;
    };
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn({
        message: 'Refresh token expired',
        error: error.message,
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({
        message: 'Invalid refresh token',
        error: error.message,
      });
    } else {
      logger.warn({
        message: 'Refresh token verification failed',
        error: error as Error,
      });
    }
    return null;
  }
}

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Fallback to cookie-based auth
    const token = req.cookies?.auth_token;

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // @ts-ignore - Add user ID to request for use in route handlers
    req.userId = decoded.userId;
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      error: 'Bearer token is required',
      code: 'NO_BEARER_TOKEN',
    });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  // @ts-ignore - Add user ID to request for use in route handlers
  req.userId = decoded.userId;
  next();
}
