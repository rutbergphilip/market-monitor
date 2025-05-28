import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import logger from '@/integrations/logger';

import type { Watcher, WatcherQuery } from '@/types/watchers';

type CreateWatcherInput = {
  queries: WatcherQuery[]; // At least one query is required
  schedule: string;
  notifications: Watcher['notifications'];
  min_price?: number | null;
  max_price?: number | null;
};

type UpdateWatcherInput = {
  queries?: WatcherQuery[];
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
 * Get queries for a specific watcher
 * @param watcherId - The watcher ID
 * @returns Array of queries for the watcher
 */
function getWatcherQueries(watcherId: string): WatcherQuery[] {
  try {
    const stmt = db.prepare(`
      SELECT id, query, enabled, marketplace FROM watcher_queries 
      WHERE watcher_id = ? 
      ORDER BY created_at ASC
    `);
    const rows = stmt.all(watcherId) as {
      id: string;
      query: string;
      enabled: number;
      marketplace: string;
    }[];

    return rows.map((row) => ({
      id: row.id,
      query: row.query,
      enabled: Boolean(row.enabled),
      marketplace: row.marketplace as any, // Type assertion for MarketplaceType
    }));
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error fetching watcher queries',
      watcherId,
    });
    return [];
  }
}

/**
 * Create queries for a watcher
 * @param watcherId - The watcher ID
 * @param queries - Array of queries to create
 */
function createWatcherQueries(
  watcherId: string,
  queries: WatcherQuery[],
): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO watcher_queries (watcher_id, query, enabled, marketplace, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    for (const query of queries) {
      stmt.run(
        watcherId,
        query.query,
        query.enabled !== false ? 1 : 0,
        query.marketplace || 'blocket', // Default to blocket for backward compatibility
        now,
        now,
      );
    }
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error creating watcher queries',
      watcherId,
    });
    throw error;
  }
}

/**
 * Update queries for a watcher
 * @param watcherId - The watcher ID
 * @param queries - Array of queries to update
 */
function updateWatcherQueries(
  watcherId: string,
  queries: WatcherQuery[],
): void {
  try {
    // Delete existing queries
    const deleteStmt = db.prepare(
      `DELETE FROM watcher_queries WHERE watcher_id = ?`,
    );
    deleteStmt.run(watcherId);

    // Create new queries
    if (queries && queries.length > 0) {
      createWatcherQueries(watcherId, queries);
    }
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error updating watcher queries',
      watcherId,
    });
    throw error;
  }
}

/**
 * Get all watchers with their queries
 * @returns {Watcher[]} List of all watchers with their queries
 */
export function getAll(): Watcher[] {
  try {
    // First get all watchers
    const watcherStmt = db.prepare(
      `SELECT * FROM watchers ORDER BY created_at DESC`,
    );
    const watcherRows = watcherStmt.all() as WatcherRow[];

    return watcherRows.map((row) => {
      const queries = getWatcherQueries(row.id);

      return {
        id: row.id,
        queries: queries, // Always return the queries from watcher_queries table
        schedule: row.schedule,
        notifications: JSON.parse(row.notifications),
        status: row.status,
        last_run: row.last_run,
        created_at: row.created_at,
        updated_at: row.updated_at,
        min_price: row.min_price,
        max_price: row.max_price,
      };
    });
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
      INSERT INTO watchers (schedule, notifications, status, last_run, created_at, updated_at, min_price, max_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      input.schedule,
      JSON.stringify(input.notifications),
      'active',
      null,
      now,
      now,
      input.min_price || null,
      input.max_price || null,
    );

    const watcherId = String(info.lastInsertRowid);

    // Store all queries in the watcher_queries table
    if (input.queries && input.queries.length > 0) {
      createWatcherQueries(watcherId, input.queries);
    }

    logger.info({
      message: 'Watcher created',
      watcherId: watcherId,
      totalQueries: input.queries?.length || 0,
    });

    const queries = getWatcherQueries(watcherId);

    return {
      id: watcherId,
      queries: queries,
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

    if (updates.length === 0 && !input.queries) {
      logger.warn({
        message: 'No updates provided',
        id,
        input,
      });
      return watcher;
    }

    // Update queries if provided
    if (input.queries !== undefined) {
      updateWatcherQueries(id, input.queries);
    }

    if (updates.length > 0) {
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
        queriesUpdated: input.queries !== undefined,
      });

      if (info.changes === 0) {
        return watcher;
      }
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

    const queries = getWatcherQueries(row.id);

    return {
      id: row.id,
      queries: queries, // Always return the queries from watcher_queries table
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
