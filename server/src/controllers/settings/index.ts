import { SettingRepository } from '@/db/repositories';
import { DEFAULT_SETTINGS, SettingKey } from '@/types/settings';
import logger from '@/integrations/logger';
import emitter, { SettingsEvents } from '@/events';

import type { Request, Response } from 'express';

/**
 * Get all settings
 */
export async function getAll(req: Request, res: Response) {
  try {
    const settings = SettingRepository.getAll();

    // If no settings found, initialize them with defaults first
    if (settings.length === 0) {
      logger.info('No settings found, initializing with defaults');
      SettingRepository.initializeSettings();
      // Fetch again after initialization
      const initializedSettings = SettingRepository.getAll();
      res.json(initializedSettings);
      return;
    }

    res.json(settings);
  } catch (error) {
    logger.error({
      message: 'Error fetching settings',
      error: error as Error,
    });
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

/**
 * Get a setting by key
 */
export async function getByKey(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const setting = SettingRepository.getByKey(key);

    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }

    res.json(setting);
  } catch (error) {
    logger.error({
      message: 'Error fetching setting by key',
      error: error as Error,
      key: req.params.key,
    });
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
}

/**
 * Update a setting
 */
export async function update(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    // Validate input
    if (value === undefined) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }

    const updatedSetting = SettingRepository.updateByKey(
      key,
      value,
      description,
    );

    if (!updatedSetting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }

    // Emit event that settings have been updated
    emitter.emit(SettingsEvents.UPDATED, { key, value });
    logger.debug({
      message: 'Settings updated event emitted',
      key,
    });

    res.json(updatedSetting);
  } catch (error) {
    logger.error({
      message: 'Error updating setting',
      error: error as Error,
      key: req.params.key,
    });
    res.status(500).json({ error: 'Failed to update setting' });
  }
}

/**
 * Reset all settings to default values
 */
export async function resetAllToDefaults(req: Request, res: Response) {
  try {
    const results = [];

    for (const [key, { value, description }] of Object.entries(
      DEFAULT_SETTINGS,
    )) {
      const existing = SettingRepository.getByKey(key);

      if (existing) {
        results.push(SettingRepository.updateByKey(key, value, description));
      } else {
        results.push(
          SettingRepository.create({
            key,
            value,
            description,
          }),
        );
      }
    }

    // Emit event that all settings have been reset
    emitter.emit(SettingsEvents.UPDATED, { key: 'all', value: 'reset' });
    logger.debug({
      message: 'All settings reset event emitted',
    });

    res.json({
      message: 'All settings reset to default values',
      count: results.length,
    });
  } catch (error) {
    logger.error({
      message: 'Error resetting settings to defaults',
      error: error as Error,
    });
    res.status(500).json({ error: 'Failed to reset settings' });
  }
}

/**
 * Get default values
 */
export async function getDefaults(req: Request, res: Response) {
  try {
    const defaults = Object.entries(DEFAULT_SETTINGS).map(
      ([key, { value, description }]) => ({
        key,
        value,
        description,
      }),
    );

    res.json(defaults);
  } catch (error) {
    logger.error({
      message: 'Error fetching default settings',
      error: error as Error,
    });
    res.status(500).json({ error: 'Failed to fetch default settings' });
  }
}
