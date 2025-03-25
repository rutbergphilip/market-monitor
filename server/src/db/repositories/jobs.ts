import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuid } from 'uuid';
import logger from '@/integrations/logger';

// Job entity type definition
export interface Job {
  id?: number;
  uuid: string;
  cron_schedule: string;
  query: string;
  created_at?: string;
  updated_at?: string;
}

// Input for creating a new job
export interface CreateJobInput {
  cron_schedule: string;
  query: string;
}

// Input for updating an existing job
export interface UpdateJobInput {
  cron_schedule?: string;
  query?: string;
}

// Get database connection
const envDbPath = process.env.DB_PATH || 'db.sqlite';
const dbPath = path.isAbsolute(envDbPath)
  ? envDbPath
  : path.join(__dirname, '..', envDbPath);
const db = new Database(dbPath);

/**
 * Create a new job
 * @param input Job input data
 * @returns Created job with all fields
 */
export function create(input: CreateJobInput): Job {
  try {
    const jobUuid = uuid();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO jobs (uuid, cron_schedule, query, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(jobUuid, input.cron_schedule, input.query, now, now);
    logger.info({
      message: 'Job created',
      jobId: info.lastInsertRowid,
      query: input.query,
    });

    return {
      id: Number(info.lastInsertRowid),
      uuid: jobUuid,
      cron_schedule: input.cron_schedule,
      query: input.query,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error creating job',
      input,
    });
    throw error;
  }
}

/**
 * Get all jobs
 * @param limit Maximum number of jobs to return (optional)
 * @param offset Number of jobs to skip (optional, for pagination)
 * @returns Array of jobs
 */
export function list(limit?: number, offset?: number): Job[] {
  try {
    let query = 'SELECT * FROM jobs ORDER BY created_at DESC';

    if (limit !== undefined) {
      query += ` LIMIT ${limit}`;

      if (offset !== undefined) {
        query += ` OFFSET ${offset}`;
      }
    }

    const jobs = db.prepare(query).all() as Job[];
    logger.debug({
      message: 'Retrieved jobs',
      count: jobs.length,
      limit,
      offset,
    });
    return jobs;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error listing jobs',
      limit,
      offset,
    });
    throw error;
  }
}

/**
 * Find job by ID
 * @param id Job ID
 * @returns Job or null if not found
 */
export function getById(id: number): Job | null {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as
      | Job
      | undefined;
    logger.debug({
      message: 'Job retrieved by ID',
      jobId: id,
      found: !!job,
    });
    return job || null;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error getting job by ID',
      jobId: id,
    });
    throw error;
  }
}

/**
 * Find job by UUID
 * @param uuid Job UUID
 * @returns Job or null if not found
 */
export function getByUUID(uuid: string): Job | null {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE uuid = ?').get(uuid) as
      | Job
      | undefined;
    logger.debug({
      message: 'Job retrieved by UUID',
      uuid,
      found: !!job,
    });
    return job || null;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error getting job by UUID',
      uuid,
    });
    throw error;
  }
}

/**
 * Update a job by UUID
 * @param uuid Job UUID to update
 * @param input Job data to update
 * @returns Updated job or null if not found
 */
export function update(uuid: string, input: UpdateJobInput): Job | null {
  try {
    const job = getByUUID(uuid);

    if (!job) {
      logger.warn({
        message: 'Job not found for update',
        uuid,
      });
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.cron_schedule !== undefined) {
      updates.push('cron_schedule = ?');
      values.push(input.cron_schedule);
    }

    if (input.query !== undefined) {
      updates.push('query = ?');
      values.push(input.query);
    }

    if (updates.length === 0) {
      logger.warn({
        message: 'No updates provided',
        uuid,
        input,
      });
      return job;
    }

    updates.push('updated_at = ?');
    const now = new Date().toISOString();
    values.push(now);
    values.push(uuid);

    const stmt = db.prepare(`
      UPDATE jobs
      SET ${updates.join(', ')}
      WHERE uuid = ?
    `);

    const info = stmt.run(...values);
    logger.info({
      message: 'Job updated',
      uuid,
      changes: info.changes,
    });

    if (info.changes === 0) {
      return job;
    }

    return getByUUID(uuid);
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error updating job',
      uuid,
      input,
    });
    throw error;
  }
}

/**
 * Delete a job by UUID
 * @param uuid Job UUID to delete
 * @returns True if deleted, false if not found
 */
export function remove(uuid: string): boolean {
  try {
    const stmt = db.prepare('DELETE FROM jobs WHERE uuid = ?');
    const info = stmt.run(uuid);
    logger.info({
      message: 'Job deleted',
      uuid,
      success: info.changes > 0,
    });

    return info.changes > 0;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error deleting job',
      uuid,
    });
    throw error;
  }
}

/**
 * Count total jobs
 * @returns Total number of jobs
 */
export function count(): number {
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as {
      count: number;
    };
    logger.debug({
      message: 'Jobs counted',
      total: result.count,
    });
    return result.count;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error counting jobs',
    });
    throw error;
  }
}

/**
 * Search for jobs by query string
 * @param searchQuery Search query string
 * @returns Array of matching jobs
 */
export function search(searchQuery: string): Job[] {
  try {
    const stmt = db.prepare(`
      SELECT * FROM jobs 
      WHERE query LIKE ? OR cron_schedule LIKE ?
      ORDER BY created_at DESC
    `);

    const searchPattern = `%${searchQuery}%`;
    const jobs = stmt.all(searchPattern, searchPattern) as Job[];
    logger.debug({
      message: 'Jobs search completed',
      query: searchQuery,
      results: jobs.length,
    });

    return jobs;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error searching jobs',
      query: searchQuery,
    });
    throw error;
  }
}
