import type { BlocketAd } from 'blocket.js';

/**
 * Cache for Blocket ads
 * @type {Map<string, BlocketAd>}
 * @param {string} key - Blocket ad id
 * @param {BlocketAd} value - Blocket ad data
 */
export const cache: Map<string, BlocketAd> = new Map<string, BlocketAd>();
