import type { BlocketQueryConfig } from 'blocket.js';

export const BLOCKET_JOB_CONFIG = Object.freeze({
  cronTime: process.env.BLOCKET_CRON_TIME || '*/5 * * * *',
  timeZone: process.env.BLOCKET_TIMEZONE || 'Europe/Stockholm',
  runOnInit: true,
});

export const BLOCKET_QUERY = Object.freeze({
  query: process.env.BLOCKET_AD_QUERY,
  limit: parseInt(process.env.BLOCKET_AD_LIMIT ?? '60') || 60,
  sort: process.env.BLOCKET_AD_SORT ?? 'rel',
  listingType: process.env.BLOCKET_AD_LISTING_TYPE ?? 's',
  status: process.env.BLOCKET_AD_STATUS ?? 'active',
  geolocation: parseInt(process.env.BLOCKET_AD_GL ?? '3') || 3,
  include: process.env.BLOCKET_AD_INCLUDE ?? 'extend_with_shipping',
}) as BlocketQueryConfig;

export const BLOCKET_QUERIES = (process.env.BLOCKET_AD_QUERIES || '')
  .split(',')
  .map((query) => query.trim());

export const BLOCKET_MONITORING_CONFIG = Object.freeze({
  // default values should always be null
  pricing: {
    active: process.env.OPT_PRICE_CHANGES === 'true',
    min: parseInt(process.env.OPT_PRICE_MIN ?? 'null') || null,
    max: parseInt(process.env.OPT_PRICE_MAX ?? 'null') || null,
    currency: process.env.OPT_PRICE_CURRENCY ?? 'SEK',
  },
});
