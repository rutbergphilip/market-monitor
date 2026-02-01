import type { BlocketQueryConfig } from 'blocket.js';
import { SettingRepository } from '@/db/repositories';
import { SettingKey } from '@/types/settings';

// Map old sort values to new BlocketSortOrder values
const SORT_MAP: Record<string, 'RELEVANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'PUBLISHED_ASC' | 'PUBLISHED_DESC'> = {
  rel: 'RELEVANCE',
  price_asc: 'PRICE_ASC',
  price_desc: 'PRICE_DESC',
  date_asc: 'PUBLISHED_ASC',
  date_desc: 'PUBLISHED_DESC',
};

// Default configuration for Blocket queries used by watcher jobs
// This is a partial config that gets merged with the actual query
export const BLOCKET_QUERY: Omit<BlocketQueryConfig, 'query'> = Object.freeze({
  limit: parseInt(
    SettingRepository.getValue(SettingKey.BLOCKET_QUERY_LIMIT) || '60',
  ),
  sort: SORT_MAP[SettingRepository.getValue(SettingKey.BLOCKET_QUERY_SORT) || 'rel'] || 'RELEVANCE',
});

export const BLOCKET_MONITORING_CONFIG = Object.freeze({});
