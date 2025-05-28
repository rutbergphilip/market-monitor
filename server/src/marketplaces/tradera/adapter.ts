import { BaseMarketplaceAdapter } from '../base/adapter';
import type {
  BaseAd,
  SearchQuery,
  SearchConfig,
  SearchResult,
  MarketplaceCapabilities,
  MarketplaceSettings,
} from '../base/types';

/**
 * Tradera marketplace implementation
 * This is a simplified example showing how to add a new marketplace
 */
export class TraderaAdapter extends BaseMarketplaceAdapter {
  readonly type = 'TRADERA' as const;
  readonly name = 'Tradera';
  readonly capabilities: MarketplaceCapabilities = {
    supportsPriceFilters: true,
    supportsLocationFilters: false,
    supportsCategoryFilters: true,
    supportsDateFilters: false,
    supportsImageSearch: false,
    supportsAdvancedSearch: true,
    maxQueriesPerRequest: 1,
    rateLimitPerMinute: 60,
  };

  /**
   * Search for ads on Tradera
   */
  async search(
    query: SearchQuery,
    config?: SearchConfig,
  ): Promise<SearchResult> {
    try {
      // Transform the query for Tradera's API
      const transformedQuery = this.transformQuery(query);

      // Perform the search (mock implementation)
      const rawResults = await this.performSearch(transformedQuery);

      // Transform results to BaseAd format
      const ads = rawResults.map((rawAd) => this.transformAd(rawAd));

      return {
        ads,
        hasMore: false,
        totalCount: ads.length,
      };
    } catch (error) {
      throw new Error(`Tradera search failed: ${error}`);
    }
  }

  /**
   * Get default settings for Tradera
   */
  getDefaultSettings(): MarketplaceSettings {
    return {
      api: {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 10000,
        baseUrl: 'https://api.tradera.com',
      },
      query: {
        defaultLimit: 20,
        defaultSort: 'newest',
      },
    };
  }

  /**
   * Validate Tradera-specific settings
   */
  validateSettings(settings: Partial<MarketplaceSettings>): boolean {
    // Add any Tradera-specific validation here
    return true;
  }

  /**
   * Transform Tradera API response to BaseAd format
   */
  transformAd(rawAd: any): BaseAd {
    return {
      id: rawAd.id,
      title: rawAd.title,
      price: {
        value: rawAd.price,
        currency: rawAd.currency || 'SEK',
      },
      url: rawAd.url,
      images: rawAd.imageUrl ? [rawAd.imageUrl] : [],
      location: rawAd.location,
      publishedAt: new Date(rawAd.publishedAt),
      marketplace: 'TRADERA',
      description: rawAd.description,
      rawData: rawAd,
    };
  }

  /**
   * Transform a search query for Tradera's API format
   */
  private transformQuery(query: SearchQuery): any {
    return {
      q: query.query,
      ...(query.minPrice && { price_min: query.minPrice }),
      ...(query.maxPrice && { price_max: query.maxPrice }),
      ...(query.category && { category: query.category }),
      ...(query.filters?.condition && { condition: query.filters.condition }),
    };
  }

  /**
   * Perform the actual search on Tradera
   * Note: This is a mock implementation - in reality you would integrate with Tradera's API
   */
  private async performSearch(transformedQuery: any): Promise<any[]> {
    // Mock implementation - in reality this would call Tradera's API
    return [
      {
        id: 'tradera_123',
        title: `Mock Tradera result for "${transformedQuery.q}"`,
        price: 299,
        currency: 'SEK',
        url: 'https://tradera.com/item/123',
        imageUrl: 'https://tradera.com/image/123.jpg',
        location: 'Stockholm',
        publishedAt: new Date().toISOString(),
        description: 'Mock description for Tradera item',
      },
    ];
  }
}
