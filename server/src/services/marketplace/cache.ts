import type { BaseAd, MarketplaceType } from '@/marketplaces/base';
import type { Notification } from '@/types/watchers';

/**
 * Cache for marketplace ads
 * Key: marketplace:ad_id
 * Value: BaseAd
 */
export class MarketplaceCache {
  private cache = new Map<string, BaseAd>();

  /**
   * Get cache key for an ad
   */
  private getCacheKey(marketplace: MarketplaceType, adId: string): string {
    return `${marketplace}:${adId}`;
  }

  /**
   * Add ad to cache
   */
  set(ad: BaseAd): void {
    const key = this.getCacheKey(ad.marketplace, ad.id);
    this.cache.set(key, ad);
  }

  /**
   * Get ad from cache
   */
  get(marketplace: MarketplaceType, adId: string): BaseAd | undefined {
    const key = this.getCacheKey(marketplace, adId);
    return this.cache.get(key);
  }

  /**
   * Check if ad exists in cache
   */
  has(marketplace: MarketplaceType, adId: string): boolean {
    const key = this.getCacheKey(marketplace, adId);
    return this.cache.has(key);
  }

  /**
   * Remove ad from cache
   */
  delete(marketplace: MarketplaceType, adId: string): boolean {
    const key = this.getCacheKey(marketplace, adId);
    return this.cache.delete(key);
  }

  /**
   * Get all ads for a specific marketplace
   */
  getByMarketplace(marketplace: MarketplaceType): BaseAd[] {
    const prefix = `${marketplace}:`;
    return Array.from(this.cache.entries())
      .filter(([key]) => key.startsWith(prefix))
      .map(([, ad]) => ad);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entries for specific marketplace
   */
  clearMarketplace(marketplace: MarketplaceType): void {
    const prefix = `${marketplace}:`;
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.startsWith(prefix),
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  getStats(): Record<MarketplaceType, number> {
    const stats = {} as Record<MarketplaceType, number>;

    for (const [key] of this.cache) {
      const marketplace = key.split(':')[0] as MarketplaceType;
      stats[marketplace] = (stats[marketplace] || 0) + 1;
    }

    return stats;
  }
}

export const marketplaceCache = new MarketplaceCache();
