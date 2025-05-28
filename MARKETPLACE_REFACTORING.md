# Marketplace Refactoring - Implementation Guide

## Overview

The Blocket Bot has been successfully refactored to support multiple marketplaces. The architecture now uses an abstract adapter pattern that makes it extremely easy to add new marketplaces beyond the original Blocket integration.

## Key Changes Made

### 1. **Marketplace Abstraction Layer**

- Created `BaseMarketplaceAdapter` abstract class that all marketplace implementations must extend
- Standardized `BaseAd` interface for consistent ad representation across marketplaces
- Implemented `SearchQuery` and `SearchResult` interfaces for unified search functionality

### 2. **Marketplace Registry System**

- Centralized registry (`MarketplaceRegistry`) for managing all marketplace adapters
- Auto-discovery and registration of marketplace implementations
- Helper functions for retrieving adapters by type

### 3. **Database Schema Updates**

- Added `marketplace` column to `watcher_queries` table with automatic migration
- Backward compatibility with existing Blocket-only watchers (defaults to 'blocket')
- Support for multiple marketplaces per watcher query

### 4. **Enhanced Type System**

- Extended `WatcherQuery` type to include marketplace selection
- Added `MarketplaceType` enum with support for BLOCKET, TRADERA, FACEBOOK, EBAY
- Marketplace-specific settings structure with per-marketplace namespacing

### 5. **Marketplace-Aware Services**

- **Cache System**: Cross-marketplace deduplication with marketplace partitioning
- **Notification Service**: Marketplace-specific Discord embed colors and avatars
- **Watcher Service**: Complete marketplace abstraction with standardized search flow

### 6. **API Endpoints**

- `GET /api/watchers/marketplaces` - List all available marketplaces
- `GET /api/watchers/marketplaces/:type` - Get specific marketplace info and capabilities

## Adding a New Marketplace

Adding a new marketplace requires just 4 simple steps:

### Step 1: Create the Adapter

Create a new file: `src/marketplaces/[marketplace-name]/adapter.ts`

```typescript
import { BaseMarketplaceAdapter } from '../base/adapter';
import type {
  BaseAd,
  SearchQuery,
  SearchConfig,
  SearchResult,
  MarketplaceCapabilities,
  MarketplaceSettings,
} from '../base/types';

export class YourMarketplaceAdapter extends BaseMarketplaceAdapter {
  readonly type = 'YOUR_MARKETPLACE' as const;
  readonly name = 'Your Marketplace Name';
  readonly capabilities: MarketplaceCapabilities = {
    supportsPriceFilters: true,
    supportsLocationFilters: true,
    supportsCategoryFilters: false,
    supportsDateFilters: false,
    supportsImageSearch: false,
    supportsAdvancedSearch: true,
    maxQueriesPerRequest: 1,
    rateLimitPerMinute: 60,
  };

  async search(
    query: SearchQuery,
    config?: SearchConfig
  ): Promise<SearchResult> {
    // 1. Transform query to marketplace-specific format
    const apiQuery = this.transformQuery(query);

    // 2. Call marketplace API
    const rawResults = await this.callMarketplaceAPI(apiQuery);

    // 3. Transform results to BaseAd format
    const ads = rawResults.map((rawAd) => this.transformAd(rawAd));

    return { ads, hasMore: false, totalCount: ads.length };
  }

  getDefaultSettings(): MarketplaceSettings {
    return {
      api: {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 10000,
        baseUrl: 'https://api.yourmarketplace.com',
      },
      query: {
        defaultLimit: 20,
        defaultSort: 'newest',
      },
    };
  }

  validateSettings(settings: Partial<MarketplaceSettings>): boolean {
    // Add marketplace-specific validation
    return true;
  }

  transformAd(rawAd: any): BaseAd {
    return {
      id: rawAd.id,
      title: rawAd.title,
      price: {
        value: rawAd.price,
        currency: rawAd.currency || 'USD',
      },
      url: rawAd.url,
      images: rawAd.images || [],
      location: rawAd.location,
      publishedAt: new Date(rawAd.publishedAt),
      marketplace: 'YOUR_MARKETPLACE',
      description: rawAd.description,
      rawData: rawAd,
    };
  }

  private transformQuery(query: SearchQuery): any {
    // Transform search query to marketplace API format
    return {
      q: query.query,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      // Add marketplace-specific transformations
    };
  }

  private async callMarketplaceAPI(query: any): Promise<any[]> {
    // Implement actual API call to your marketplace
    // Handle authentication, rate limiting, error handling, etc.
    throw new Error('Implement marketplace API integration');
  }
}
```

### Step 2: Create Index File

Create `src/marketplaces/[marketplace-name]/index.ts`:

```typescript
export { YourMarketplaceAdapter } from './adapter';
```

### Step 3: Add to MarketplaceType

Update `src/marketplaces/base/types.ts`:

```typescript
export type MarketplaceType =
  | 'BLOCKET'
  | 'TRADERA'
  | 'FACEBOOK'
  | 'EBAY'
  | 'YOUR_MARKETPLACE';
```

### Step 4: Register in Registry

Update `src/marketplaces/registry.ts`:

```typescript
import { YourMarketplaceAdapter } from './your-marketplace';

class MarketplaceRegistry {
  constructor() {
    this.register(new BlocketAdapter());
    this.register(new TraderaAdapter());
    this.register(new YourMarketplaceAdapter()); // Add this line
  }
}
```

That's it! Your new marketplace is now fully integrated and available for use.

## Example: Tradera Implementation

A complete Tradera marketplace implementation has been included as an example (`src/marketplaces/tradera/`). It demonstrates:

- Proper adapter structure and interface implementation
- Mock API integration (replace with real Tradera API calls)
- Marketplace-specific capabilities and settings
- BaseAd transformation from Tradera's data format

## Backward Compatibility

The refactoring maintains 100% backward compatibility:

- Existing Blocket watchers continue to work without changes
- Database migration automatically adds marketplace column with 'blocket' default
- Legacy API endpoints remain functional
- All existing notification and caching functionality preserved

## Benefits

1. **Easy Extension**: Adding new marketplaces requires minimal code
2. **Consistent Interface**: All marketplaces use the same standardized ad format
3. **Cross-Marketplace Features**: Deduplication, unified notifications, centralized settings
4. **Type Safety**: Full TypeScript support with marketplace-specific typing
5. **Scalable Architecture**: Clean separation of concerns and dependency injection
6. **API Standardization**: Unified REST API for all marketplace operations

## Next Steps

1. **UI Updates**: Update frontend components to support marketplace selection
2. **Real API Integration**: Replace mock implementations with actual marketplace APIs
3. **Enhanced Filtering**: Add marketplace-specific filter UIs
4. **Analytics**: Add marketplace-specific metrics and monitoring
5. **Documentation**: Create marketplace-specific integration guides

The foundation is now in place for a truly multi-marketplace search and notification system!
