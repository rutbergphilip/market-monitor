import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import logger from '@/integrations/logger';

import type { Watcher } from '@/types/watchers';

type CreateWatcherInput = {
  query: string;
  schedule: string;
  notifications: Watcher['notifications'];
  min_price?: number | null;
  max_price?: number | null;
};

type UpdateWatcherInput = {
  query?: string;
  schedule?: string;
  notifications?: Watcher['notifications'];
  min_price?: number | null;
  max_price?: number | null;
};

/**
 * Determines the database path based on environment:
 * - In non-production environments, it uses a local path.
 * - In production, it requires the DB_PATH environment variable to be set.
 */
function determineDbPath(): string {
  if (process.env.NODE_ENV !== 'production') {
    console.log('PATH:', path.join(__dirname, '.', 'db.sqlite'));
    return path.join(__dirname, '..', 'db.sqlite');
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

logger.info({
  message: `Using database path in watchers repository: ${dbPath}`,
});
const db = new Database(dbPath);

/**
 * Get all watchers
 * @returns {Watcher[]} List of all watchers
 */
export function getAll(): Watcher[] {
  try {
    const stmt = db.prepare(`SELECT * FROM watchers`);
    const rows = stmt.all() as WatcherRow[];

    return rows.map((row) => ({
      id: row.id,
      query: row.query,
      schedule: row.schedule,
      notifications: JSON.parse(row.notifications),
      status: row.status,
      last_run: row.last_run,
      created_at: row.created_at,
      updated_at: row.updated_at,
      min_price: row.min_price,
      max_price: row.max_price,
    }));
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error fetching all watchers',
    });
    throw error;
  }
}

/**
 * Create a new watcher
 * @param input Watcher input data
 * @returns Created watcher with all fields
 */
export function create(input: CreateWatcherInput): Watcher {
  try {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO watchers (query, schedule, notifications, status, last_run, created_at, updated_at, min_price, max_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      input.query,
      input.schedule,
      JSON.stringify(input.notifications),
      'active',
      null,
      now,
      now,
      input.min_price || null,
      input.max_price || null,
    );

    logger.info({
      message: 'Watcher created',
      watcherId: info.lastInsertRowid,
      query: input.query,
    });

    return {
      id: String(info.lastInsertRowid),
      query: input.query,
      schedule: input.schedule,
      notifications: input.notifications,
      status: 'active',
      last_run: null,
      created_at: now,
      updated_at: now,
      min_price: input.min_price || null,
      max_price: input.max_price || null,
    };
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error creating watcher',
      input,
    });
    throw error;
  }
}

/**
 * Update a watcher by id
 * @param id Watcher id to update
 * @param input Watcher data to update
 * @returns Updated watcher or null if not found
 */
export function update(id: string, input: UpdateWatcherInput): Watcher | null {
  try {
    const watcher = getById(id);

    if (!watcher) {
      logger.warn({
        message: 'Watcher not found for update',
        id,
      });
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.query !== undefined) {
      updates.push('query = ?');
      values.push(input.query);
    }

    if (input.schedule !== undefined) {
      updates.push('schedule = ?');
      values.push(input.schedule);
    }

    if (input.notifications !== undefined) {
      updates.push('notifications = ?');
      values.push(JSON.stringify(input.notifications));
    }

    if (input.min_price !== undefined) {
      updates.push('min_price = ?');
      values.push(input.min_price);
    }

    if (input.max_price !== undefined) {
      updates.push('max_price = ?');
      values.push(input.max_price);
    }

    if (updates.length === 0) {
      logger.warn({
        message: 'No updates provided',
        id,
        input,
      });
      return watcher;
    }

    updates.push('updated_at = ?');
    const now = new Date().toISOString();
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`
      UPDATE watchers
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    const info = stmt.run(...values);
    logger.info({
      message: 'Watcher updated',
      id,
      changes: info.changes,
    });

    if (info.changes === 0) {
      return watcher;
    }

    return getById(id);
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error updating watcher',
      id,
      input,
    });
    throw error;
  }
}

/**
 * Delete a watcher by id
 * @param id Watcher id to delete
 * @returns Number of deleted rows
 */
export function remove(id: string): number {
  try {
    const stmt = db.prepare(`
      DELETE FROM watchers WHERE id = ?
    `);
    const info = stmt.run(id);
    logger.info({
      message: 'Watcher deleted',
      id,
      changes: info.changes,
    });
    return info.changes;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error deleting watcher',
      id,
    });
    throw error;
  }
}

type WatcherRow = {
  id: string;
  query: string;
  schedule: string;
  notifications: string; // Stored as JSON string in the database
  status: 'active' | 'stopped';
  last_run: string;
  created_at: string;
  updated_at: string;
  min_price: number | null;
  max_price: number | null;
};

/**
 * Get a watcher by id
 * @param id Watcher id to fetch
 * @returns Watcher or null if not found
 */
export function getById(id: string): Watcher | null {
  try {
    const stmt = db.prepare(`
      SELECT * FROM watchers WHERE id = ?
    `);
    const row = stmt.get(id) as WatcherRow | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      query: row.query,
      schedule: row.schedule,
      notifications: JSON.parse(row.notifications),
      status: row.status,
      last_run: row.last_run,
      created_at: row.created_at,
      updated_at: row.updated_at,
      min_price: row.min_price,
      max_price: row.max_price,
    };
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error fetching watcher by ID',
      id,
    });
    throw error;
  }
}

/**
 * @param id Watcher id to start
 * @description Starts a watcher by updating its status to 'active'
 * @returns Watcher or null if not found
 */
export function start(id: string): Watcher | null {
  try {
    const watcher = getById(id);

    if (!watcher) {
      logger.warn({
        message: 'Watcher not found for start',
        id,
      });
      return null;
    }

    const stmt = db.prepare(`
      UPDATE watchers
      SET status = 'active'
      WHERE id = ?
    `);
    stmt.run(id);

    logger.info({
      message: 'Watcher started',
      id,
    });

    return { ...watcher, status: 'active' };
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error starting watcher',
      id,
    });
    throw error;
  }
}

/**
 * @param id Watcher id to stop
 * @description Stops a watcher by updating its status to 'stopped'
 * @returns Watcher or null if not found
 */
export function stop(id: string): Watcher | null {
  try {
    const watcher = getById(id);

    if (!watcher) {
      logger.warn({
        message: 'Watcher not found for stop',
        id,
      });
      return null;
    }

    const stmt = db.prepare(`
      UPDATE watchers
      SET status = 'stopped'
      WHERE id = ?
    `);
    stmt.run(id);

    logger.info({
      message: 'Watcher stopped',
      id,
    });

    return { ...watcher, status: 'stopped' };
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error stopping watcher',
      id,
    });
    throw error;
  }
}

/**
 * @param id Watcher id to update
 */
export function updateLastRun(id: string): void {
  try {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE watchers
      SET last_run = ?
      WHERE id = ?
    `);
    stmt.run(now, id);
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error updating last run',
      id,
    });
    throw error;
  }
}
