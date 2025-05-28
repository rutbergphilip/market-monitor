/**
 * Base types for marketplace abstraction
 */

export type MarketplaceType = 'BLOCKET' | 'TRADERA';

export interface BaseAd {
  id: string;
  title: string;
  price: {
    value: number;
    currency: string;
    suffix?: string;
  };
  description?: string;
  url: string;
  images: string[];
  location?: string;
  publishedAt: Date;
  marketplace: MarketplaceType;
  rawData?: any; // Store original marketplace-specific data
}

export interface SearchQuery {
  query: string;
  maxPrice?: number;
  minPrice?: number;
  location?: string;
  category?: string;
  // Marketplace-specific filters can be added here
  filters?: Record<string, any>;
}

export interface SearchConfig {
  limit?: number;
  sort?: string;
  includeInactive?: boolean;
  // Marketplace-specific configurations
  [key: string]: any;
}

export interface SearchResult {
  ads: BaseAd[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
}

export interface MarketplaceSettings {
  api: {
    maxRetries: number;
    retryDelay: number;
    timeout: number;
    [key: string]: any;
  };
  query: {
    defaultLimit: number;
    defaultSort: string;
    [key: string]: any;
  };
}

export interface MarketplaceCapabilities {
  supportsPriceFilters: boolean;
  supportsLocationFilters: boolean;
  supportsCategoryFilters: boolean;
  supportsDateFilters: boolean;
  supportsImageSearch: boolean;
  supportsAdvancedSearch: boolean;
  maxQueriesPerRequest: number;
  rateLimitPerMinute: number;
}
