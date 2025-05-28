import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '@/integrations/logger';
import { SettingRepository } from '@/db/repositories';
import { SettingKey } from '@/types/settings';

const JWT_SECRET = process.env.JWT_SECRET || 'market-monitor-secret-key';
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'market-monitor-refresh-secret-key';
const REFRESH_TOKEN_EXPIRY = '30d';

export function generateToken(userId: string): string {
  const tokenExpiry: string =
    SettingRepository.getValue(SettingKey.SECURITY_TOKEN_EXPIRY) || '48h';

  // Handle "no expire" option
  if (tokenExpiry === 'never' || tokenExpiry === 'no-expire') {
    logger.info({
      message: 'Generated non-expiring JWT token',
      userId,
      tokenExpiry,
    });
    return jwt.sign({ userId }, JWT_SECRET);
  }

  logger.info({
    message: 'Generated JWT token with expiry',
    userId,
    tokenExpiry,
  });

  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: tokenExpiry as any });
}

export function generateRefreshToken(userId: string): string {
  logger.info({
    message: 'Generated refresh token',
    userId,
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyToken(token: string): { userId: string } | null {
  const tokenPreview = token.substring(0, 10) + '...';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    logger.debug({
      message: 'JWT token verified successfully',
      userId: decoded.userId,
      tokenPreview,
    });

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn({
        message: 'JWT token expired',
        error: error.message,
        tokenPreview,
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({
        message: 'Invalid JWT token',
        error: error.message,
        tokenPreview,
      });
    } else {
      logger.warn({
        message: 'JWT verification failed',
        error: error as Error,
        tokenPreview,
      });
    }
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  const tokenPreview = token.substring(0, 10) + '...';

  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as {
      userId: string;
    };

    logger.debug({
      message: 'Refresh token verified successfully',
      userId: decoded.userId,
      tokenPreview,
    });

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn({
        message: 'Refresh token expired',
        error: error.message,
        tokenPreview,
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({
        message: 'Invalid refresh token',
        error: error.message,
        tokenPreview,
      });
    } else {
      logger.warn({
        message: 'Refresh token verification failed',
        error: error as Error,
        tokenPreview,
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
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const clientIp = req.ip || req.connection.remoteAddress || 'Unknown';
  const requestPath = req.path;
  const requestMethod = req.method;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Fallback to cookie-based auth
    const token = req.cookies?.auth_token;

    if (!token) {
      logger.warn({
        message: 'Authentication failed: No token provided',
        requestPath,
        requestMethod,
        userAgent,
        clientIp,
        authMethod: 'cookie',
      });
      res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      logger.warn({
        message: 'Authentication failed: Invalid cookie token',
        requestPath,
        requestMethod,
        userAgent,
        clientIp,
        authMethod: 'cookie',
      });
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    logger.debug({
      message: 'Authentication successful via cookie',
      userId: decoded.userId,
      requestPath,
      requestMethod,
      userAgent,
      clientIp,
      authMethod: 'cookie',
    });

    // @ts-ignore - Add user ID to request for use in route handlers
    req.userId = decoded.userId;
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    logger.warn({
      message: 'Authentication failed: No bearer token provided',
      requestPath,
      requestMethod,
      userAgent,
      clientIp,
      authMethod: 'bearer',
    });
    res.status(401).json({
      error: 'Bearer token is required',
      code: 'NO_BEARER_TOKEN',
    });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    logger.warn({
      message: 'Authentication failed: Invalid bearer token',
      requestPath,
      requestMethod,
      userAgent,
      clientIp,
      authMethod: 'bearer',
    });
    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  logger.debug({
    message: 'Authentication successful via bearer token',
    userId: decoded.userId,
    requestPath,
    requestMethod,
    userAgent,
    clientIp,
    authMethod: 'bearer',
  });

  // @ts-ignore - Add user ID to request for use in route handlers
  req.userId = decoded.userId;
  next();
}
