import type { BaseMarketplaceAdapter, MarketplaceType } from './base';
import { BlocketAdapter } from './blocket';
import { TraderaAdapter } from './tradera';

/**
 * Registry of all available marketplace adapters
 */
class MarketplaceRegistry {
  private adapters = new Map<MarketplaceType, BaseMarketplaceAdapter>();

  constructor() {
    // Register all available adapters
    this.register(new BlocketAdapter());
    this.register(new TraderaAdapter());

    // TODO: Add more marketplaces here as they're implemented
    // this.register(new FacebookAdapter());
    // this.register(new EbayAdapter());
  }

  /**
   * Register a marketplace adapter
   */
  register(adapter: BaseMarketplaceAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  /**
   * Get adapter for specific marketplace
   */
  getAdapter(type: MarketplaceType): BaseMarketplaceAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) {
      throw new Error(`No adapter registered for marketplace: ${type}`);
    }
    return adapter;
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): BaseMarketplaceAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get all supported marketplace types
   */
  getSupportedTypes(): MarketplaceType[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if marketplace is supported
   */
  isSupported(type: MarketplaceType): boolean {
    return this.adapters.has(type);
  }
}

// Export singleton instance
export const marketplaceRegistry = new MarketplaceRegistry();

// Export helper functions
export const getMarketplaceAdapter = (type: MarketplaceType) =>
  marketplaceRegistry.getAdapter(type);

export const getAllMarketplaces = () => marketplaceRegistry.getAllAdapters();

export const getSupportedMarketplaces = () =>
  marketplaceRegistry.getSupportedTypes();
