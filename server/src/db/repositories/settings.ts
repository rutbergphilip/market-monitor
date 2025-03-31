import { db } from '@/db';
import logger from '@/integrations/logger';
import { DEFAULT_SETTINGS, SettingKey } from '@/types/settings';
import type { Setting } from '@/types/settings';

type SettingRow = {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
};

/**
 * Initialize default settings if they don't exist
 */
export function initializeSettings(): void {
  try {
    const existingSettings = getAll();
    const existingKeys = new Set(existingSettings.map((s) => s.key));

    // Insert any missing default settings
    for (const [key, { value, description }] of Object.entries(
      DEFAULT_SETTINGS,
    )) {
      if (!existingKeys.has(key)) {
        create({
          key,
          value,
          description,
        });
      }
    }

    logger.info({
      message: 'Settings initialized',
      settingsCount: getAll().length,
    });
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error initializing settings',
    });
    throw error;
  }
}

/**
 * Get all settings
 * @returns {Setting[]} List of all settings
 */
export function getAll(): Setting[] {
  try {
    const stmt = db.prepare(`SELECT * FROM settings`);
    const rows = stmt.all() as SettingRow[];

    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error fetching all settings',
    });
    throw error;
  }
}

/**
 * Get a setting by key
 * @param key Setting key
 * @returns Setting object or undefined if not found
 */
export function getByKey(key: string): Setting | undefined {
  try {
    const stmt = db.prepare(`SELECT * FROM settings WHERE key = ?`);
    const row = stmt.get(key) as SettingRow | undefined;

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error fetching setting by key',
      key,
    });
    throw error;
  }
}

/**
 * Get a setting's value by key, with fallback to default
 * @param key Setting key
 * @returns Setting value or default if not found
 */
export function getValue(key: SettingKey): string {
  try {
    const setting = getByKey(key);
    if (setting) {
      return setting.value;
    }

    // If not found in the database, return the default value
    return DEFAULT_SETTINGS[key]?.value || '';
  } catch (error) {
    logger.warn({
      error: error as Error,
      message: 'Error fetching setting value, using default',
      key,
      default: DEFAULT_SETTINGS[key]?.value,
    });
    return DEFAULT_SETTINGS[key]?.value || '';
  }
}

/**
 * Create a new setting
 * @param input Setting input data
 * @returns Created setting with all fields
 */
export function create(input: {
  key: string;
  value: string;
  description?: string;
}): Setting {
  try {
    const now = new Date().toISOString();
    const description = input.description || '';

    const stmt = db.prepare(`
      INSERT INTO settings (key, value, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(input.key, input.value, description, now, now);

    logger.info({
      message: 'Setting created',
      settingId: info.lastInsertRowid,
      key: input.key,
    });

    return {
      id: String(info.lastInsertRowid),
      key: input.key,
      value: input.value,
      description,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error creating setting',
      input,
    });
    throw error;
  }
}

/**
 * Update a setting by key
 * @param key Setting key to update
 * @param value New setting value
 * @param description Optional new description
 * @returns Updated setting or undefined if not found
 */
export function updateByKey(
  key: string,
  value: string,
  description?: string,
): Setting | undefined {
  try {
    const now = new Date().toISOString();
    const current = getByKey(key);

    if (!current) {
      logger.warn({
        message: 'Attempted to update non-existent setting',
        key,
      });
      return undefined;
    }

    const updates: string[] = ['value = ?', 'updated_at = ?'];
    const params: any[] = [value, now];

    // Only update description if provided
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    const stmt = db.prepare(`
      UPDATE settings
      SET ${updates.join(', ')}
      WHERE key = ?
      RETURNING *
    `);

    params.push(key);
    const row = stmt.get(...params) as SettingRow | undefined;

    if (!row) {
      return undefined;
    }

    logger.info({
      message: 'Setting updated',
      key,
      newValue: value,
    });

    return {
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error updating setting',
      key,
    });
    throw error;
  }
}

/**
 * Delete a setting by key
 * @param key Setting key to delete
 * @returns Boolean indicating success
 */
export function deleteByKey(key: string): boolean {
  try {
    const stmt = db.prepare(`DELETE FROM settings WHERE key = ?`);
    const info = stmt.run(key);

    logger.info({
      message:
        info.changes > 0 ? 'Setting deleted' : 'Setting not found for deletion',
      key,
      changes: info.changes,
    });

    return info.changes > 0;
  } catch (error) {
    logger.error({
      error: error as Error,
      message: 'Error deleting setting',
      key,
    });
    throw error;
  }
}
