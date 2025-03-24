import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuid } from 'uuid';

const envDbPath = process.env.DB_PATH || 'db.sqlite';
const dbPath = path.isAbsolute(envDbPath)
  ? envDbPath
  : path.join(__dirname, envDbPath);
const db = new Database(dbPath);

export function initializeDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value TEXT NOT NULL
    )
  `);

  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM workers')
    .get() as {
    count?: number;
  };

  if (count === 0) {
    const insert = db.prepare(
      `INSERT INTO workers (uuid, cron_schedule, query) VALUES (?, ?, ?)`,
    );
    insert.run(uuid(), 'defaultCronSchedule', 'defaultQuery');
    console.log('Default configuration seeded.');
  }
}
