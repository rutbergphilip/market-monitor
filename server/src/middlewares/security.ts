import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '@/integrations/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'blocket-bot-secret-key';
const TOKEN_EXPIRY = '24h';

// Generate a JWT token for a user
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify a JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    logger.warn({
      message: 'Invalid JWT token',
      error: error as Error,
    });
    return null;
  }
}

// Authentication middleware
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Get the auth header
  const authHeader = req.headers.authorization;

  // Check if token is provided in the auth header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Check for token in cookie as fallback
    const token = req.cookies?.auth_token;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // @ts-ignore - Add user ID to request for use in route handlers
    req.userId = decoded.userId;
    next();
    return;
  }

  // Extract token from auth header
  const token = authHeader.split(' ')[1];

  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // @ts-ignore - Add user ID to request for use in route handlers
  req.userId = decoded.userId;
  next();
}
