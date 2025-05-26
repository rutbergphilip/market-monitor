/**
 * JWT utility functions for client-side token validation
 */

export interface JWTPayload {
  exp?: number;
  iat?: number;
  userId?: string;
  username?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Decode JWT token without verification (client-side only)
 * WARNING: This is for expiration checking only, never trust the payload for security decisions
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(decoded);
  } catch (error) {
    console.warn('[JWT] Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * Returns true if expired, false if valid, null if token is invalid
 */
export function isTokenExpired(token: string): boolean | null {
  const payload = decodeJWT(token);

  if (!payload) {
    return null; // Invalid token
  }

  if (!payload.exp) {
    return false; // Token without expiration (never expires)
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get token expiration time as Date object
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJWT(token);

  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

/**
 * Check if token expires within the given number of seconds
 */
export function isTokenExpiringSoon(
  token: string,
  secondsAhead: number = 300
): boolean {
  const payload = decodeJWT(token);

  if (!payload || !payload.exp) {
    return false; // Token without expiration never expires
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp - currentTime <= secondsAhead;
}
