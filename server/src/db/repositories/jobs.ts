import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuid } from 'uuid';

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
    console.log('Job created with rowid', info.lastInsertRowid);

    return {
      id: Number(info.lastInsertRowid),
      uuid: jobUuid,
      cron_schedule: input.cron_schedule,
      query: input.query,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    console.log('Error creating job', error);
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
    console.log('Retrieved jobs count', jobs.length);
    return jobs;
  } catch (error) {
    console.log('Error getting all jobs', error);
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
    console.log('Job by ID query result', job);
    return job || null;
  } catch (error) {
    console.log('Error getting job by ID', error);
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
    console.log('Job by UUID query result', job);
    return job || null;
  } catch (error) {
    console.log('Error getting job by UUID', error);
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
      console.log('Job not found for update', uuid);
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
      console.log('No updates provided', input);
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
    console.log('Job update result', info.changes);

    if (info.changes === 0) {
      return job;
    }

    return getByUUID(uuid);
  } catch (error) {
    console.log('Error updating job', error);
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
    console.log('Delete job result', info.changes);

    return info.changes > 0;
  } catch (error) {
    console.log('Error deleting job', error);
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
    console.log('Total job count', result.count);
    return result.count;
  } catch (error) {
    console.log('Error counting jobs', error);
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
    console.log('Search jobs results count', jobs.length);

    return jobs;
  } catch (error) {
    console.log('Error searching jobs', error);
    throw error;
  }
}
