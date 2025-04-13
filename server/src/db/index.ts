import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import logger from '@/integrations/logger';
import bcrypt from 'bcrypt';

/**
 * Determines the database path based on environment:
 * - In non-production environments, it uses a local path.
 * - In production, it requires the DB_PATH environment variable to be set.
 */
function determineDbPath(): string {
  if (process.env.NODE_ENV !== 'production') {
    console.log('PATH:', path.join(__dirname, '.', 'db.sqlite'));
    return path.join(__dirname, '.', 'db.sqlite');
  }

  if (!process.env.DB_PATH) {
    throw new Error('DB_PATH environment variable is required in production.');
  }

  let dbPath = process.env.DB_PATH;

  if (!dbPath.endsWith('db.sqlite')) {
    if (dbPath.endsWith('/')) {
      dbPath = `${dbPath}db.sqlite`;
    } else {
      dbPath = `${dbPath}/db.sqlite`;
    }
  }

  dbPath = dbPath.replace(/\/\//g, '/');

  return dbPath;
}

const dbPath = determineDbPath();

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  logger.info({ message: `Creating database directory: ${dbDir}` });
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (error) {
    logger.error({
      message: `Failed to create database directory: ${dbDir}`,
      error,
    });
  }
}

logger.info({ message: `Using database path: ${dbPath}` });
const db = new Database(dbPath);

export async function initializeDb() {
  logger.info({ message: 'Initializing database', dbPath });

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule TEXT NOT NULL,
      query TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_run TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notifications TEXT DEFAULT '[]',
      min_price INTEGER,
      max_price INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatarUrl TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      revoked BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try {
    // Check if the avatarUrl column exists in the users table
    const { count: hasAvatarUrlColumn } = db
      .prepare(
        `SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name='avatarUrl'`,
      )
      .get() as { count: number };

    // Add avatarUrl column if it doesn't exist
    if (hasAvatarUrlColumn === 0) {
      logger.info('Adding avatarUrl column to users table');
      db.exec(`ALTER TABLE users ADD COLUMN avatarUrl TEXT`);
    }

    // Check for min_price and max_price columns
    const { count: hasMinPriceColumn } = db
      .prepare(
        `SELECT COUNT(*) as count FROM pragma_table_info('watchers') WHERE name='min_price'`,
      )
      .get() as { count: number };

    const { count: hasMaxPriceColumn } = db
      .prepare(
        `SELECT COUNT(*) as count FROM pragma_table_info('watchers') WHERE name='max_price'`,
      )
      .get() as { count: number };

    if (hasMinPriceColumn === 0) {
      logger.info('Adding min_price column to watchers table');
      db.exec(`ALTER TABLE watchers ADD COLUMN min_price INTEGER`);
    }

    if (hasMaxPriceColumn === 0) {
      logger.info('Adding max_price column to watchers table');
      db.exec(`ALTER TABLE watchers ADD COLUMN max_price INTEGER`);
    }
  } catch (error) {
    logger.error({
      message: 'Error updating database schema',
      error,
    });
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed admin user if no users exist
  await seedAdminUser();
}

async function seedAdminUser() {
  try {
    // Check if any users exist
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const { count } = stmt.get() as { count: number };

    if (count === 0) {
      // No users exist, create default admin
      logger.info({
        message: 'No users found, creating default admin account',
      });

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin', saltRounds);
      const now = new Date().toISOString();

      const insertStmt = db.prepare(`
        INSERT INTO users (username, email, password, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const info = insertStmt.run(
        'admin', // username
        'admin@admin.com', // default email
        hashedPassword, // hashed password
        'admin', // role
        now, // created_at
        now, // updated_at
      );

      console.log(`
┌───────────────────────────────────────────────┐
│                                               │
│            DEFAULT ADMIN CREATED              │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│  Username: admin                              │
│  Password: admin                              │
│  Email:    admin@admin.com                    │
│                                               │
│  User ID:  ${info.lastInsertRowid}            │
│                                               │
│  Role:     admin                              │
│                                               │
└───────────────────────────────────────────────┘
      `);

      logger.info({
        message: 'Default admin account created',
        username: 'admin',
        userId: info.lastInsertRowid,
      });
    }
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error seeding admin user',
    });
  }
}

export { db };
