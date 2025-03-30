import Database from 'better-sqlite3';
import path from 'path';
import logger from '@/integrations/logger';

import type { Watcher } from '@/types/watchers';

type CreateWatcherInput = {
  query: string;
  schedule: string;
  notifications: Watcher['notifications'];
};

type UpdateWatcherInput = {
  query?: string;
  schedule?: string;
  notifications?: Watcher['notifications'];
};

const envDbPath = process.env.DB_PATH || 'db.sqlite';
const dbPath = path.isAbsolute(envDbPath)
  ? envDbPath
  : path.join(__dirname, '..', envDbPath);
const db = new Database(dbPath);

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
      number_of_runs: row.number_of_runs,
      last_run: row.last_run,
      created_at: row.created_at,
      updated_at: row.updated_at,
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
 * Create a new job
 * @param input Job input data
 * @returns Created job with all fields
 */
export function create(input: CreateWatcherInput): Watcher {
  try {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO watchers (query, schedule, notifications, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      input.query,
      input.schedule,
      JSON.stringify(input.notifications),
      now,
      now,
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
      created_at: now,
      updated_at: now,
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
 * Update a job by id
 * @param id Job id to update
 * @param input Job data to update
 * @returns Updated job or null if not found
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

type WatcherRow = {
  id: string;
  query: string;
  schedule: string;
  notifications: string; // Stored as JSON string in the database
  status: 'active' | 'paused';
  number_of_runs: number;
  last_run: string;
  created_at: string;
  updated_at: string;
};

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
      number_of_runs: row.number_of_runs,
      last_run: row.last_run,
      created_at: row.created_at,
      updated_at: row.updated_at,
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
