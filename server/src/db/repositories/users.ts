import { db } from '@/db';
import logger from '@/integrations/logger';
import bcrypt from 'bcrypt';
import { UserType } from '@/types/users';

export function getByUsername(username: string): UserType | null {
  try {
    const stmt = db.prepare(`
      SELECT * FROM users WHERE username = ?
    `);

    const user = stmt.get(username) as UserType | undefined;
    return user || null;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error fetching user by username',
      username,
    });
    throw error;
  }
}

export function getByEmail(email: string): UserType | null {
  if (!email) return null;

  try {
    const stmt = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `);

    const user = stmt.get(email) as UserType | undefined;
    return user || null;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error fetching user by email',
      email,
    });
    throw error;
  }
}

export function getById(id: string): UserType | null {
  try {
    const stmt = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `);

    const user = stmt.get(id) as UserType | undefined;
    return user || null;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error fetching user by ID',
      id,
    });
    throw error;
  }
}

export async function create(user: {
  username: string;
  password: string;
  email?: string;
  role?: string;
}): Promise<Omit<UserType, 'password'>> {
  try {
    // Check if user already exists by username
    const existingUser = getByUsername(user.username);
    if (existingUser) {
      throw new Error('User with this username already exists');
    }

    // If email is provided, check if it's already in use
    if (user.email) {
      const userWithEmail = getByEmail(user.email);
      if (userWithEmail) {
        throw new Error('User with this email already exists');
      }
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      user.username,
      user.email || null,
      hashedPassword,
      user.role || 'user',
      now,
      now,
    );

    logger.info({
      message: 'User created',
      userId: info.lastInsertRowid,
      username: user.username,
    });

    return {
      id: String(info.lastInsertRowid),
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error creating user',
      username: user.username,
    });
    throw error;
  }
}

export async function validateUser(
  username: string,
  password: string,
): Promise<UserType | null> {
  try {
    const user = getByUsername(username);

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    return user;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error validating user',
      username,
    });
    throw error;
  }
}

export function getUserCount(): number {
  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM users
    `);

    const result = stmt.get() as { count: number };
    return result.count;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error counting users',
    });
    return 0;
  }
}
