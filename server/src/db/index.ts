import Database from 'better-sqlite3';
import path from 'path';
import logger from '@/integrations/logger';

const envDbPath = process.env.DB_PATH || 'db.sqlite';
const dbPath = path.isAbsolute(envDbPath)
  ? envDbPath
  : path.join(__dirname, envDbPath);
const db = new Database(dbPath);

export function initializeDb() {
  logger.info({ message: 'Initializing database', dbPath });

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

  try {
    const { count: hasMinPriceColumn } = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM pragma_table_info('watchers') WHERE name='min_price'
    `,
      )
      .get() as { count: number };

    const { count: hasMaxPriceColumn } = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM pragma_table_info('watchers') WHERE name='max_price'
    `,
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
      message: 'Error adding price range columns to watchers table',
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
}

export { db };
