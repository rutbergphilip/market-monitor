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
      number_of_runs INTEGER DEFAULT 0,
      notifications TEXT DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create settings table for application configuration
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

// Export the database instance for repositories
export { db };
