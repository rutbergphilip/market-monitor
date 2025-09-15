import type { BaseMarketplaceAdapter, MarketplaceType } from './base';
import { BlocketAdapter } from './blocket';
// import { TraderaAdapter } from './tradera'; // TODO: Implement TraderaAdapter
import logger from '@/integrations/logger';

/**
 * Registry of all available marketplace adapters
 */
class MarketplaceRegistry {
  private adapters = new Map<MarketplaceType, BaseMarketplaceAdapter>();

  constructor() {
    try {
      // Register all available adapters
      this.register(new BlocketAdapter());
      // this.register(new TraderaAdapter()); // TODO: Implement TraderaAdapter

      // TODO: Add more marketplaces here as they're implemented
      // this.register(new FacebookAdapter());
      // this.register(new EbayAdapter());

      logger.info({
        message: 'Marketplace registry initialized successfully',
        totalAdaptersRegistered: this.adapters.size,
        supportedMarketplaces: Array.from(this.adapters.keys()),
      });
    } catch (error) {
      logger.error({
        message: 'Failed to initialize marketplace registry',
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        adaptersRegisteredSoFar: this.adapters.size,
      });
      throw error;
    }
  }

  /**
   * Register a marketplace adapter
   */
  register(adapter: BaseMarketplaceAdapter): void {
    this.adapters.set(adapter.type, adapter);
    logger.debug({
      message: 'Registered marketplace adapter',
      adapterType: adapter.type,
      adapterName: adapter.name,
    });
  }

  /**
   * Get adapter for specific marketplace
   */
  getAdapter(type: MarketplaceType): BaseMarketplaceAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) {
      logger.error({
        message: 'No adapter registered for marketplace',
        requestedType: type,
        availableTypes: Array.from(this.adapters.keys()),
      });
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
export const getMarketplaceAdapter = (type: MarketplaceType) => {
  // Normalize marketplace type to uppercase to handle case mismatches
  const normalizedType = type.toUpperCase() as MarketplaceType;
  return marketplaceRegistry.getAdapter(normalizedType);
};

export const getAllMarketplaces = () => marketplaceRegistry.getAllAdapters();

export const getSupportedMarketplaces = () =>
  marketplaceRegistry.getSupportedTypes();
