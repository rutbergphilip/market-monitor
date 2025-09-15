import client, { type BlocketAd } from 'blocket.js';
import {
  BaseMarketplaceAdapter,
  type BaseAd,
  type SearchQuery,
  type SearchConfig,
  type SearchResult,
  type MarketplaceSettings,
  type MarketplaceCapabilities,
} from '../base';
import logger from '@/integrations/logger';

export class BlocketAdapter extends BaseMarketplaceAdapter {
  readonly type = 'BLOCKET' as const;
  readonly name = 'Blocket';
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

  constructor() {
    super();
    logger.debug({
      message: 'BlocketAdapter initialized',
      adapterType: this.type,
      adapterName: this.name,
    });
  }

  /**
   * Search for ads on Blocket
   */
  async search(
    query: SearchQuery,
    config?: SearchConfig,
  ): Promise<SearchResult> {
    const blocketConfig = this.buildBlocketConfig(query, config);

    let ads;
    try {
      ads = await this.withRetry(async () => {
        // Create timeout promise
        const timeoutMs = config?.timeout || 15000;
        let timeoutHandle: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(
              new Error(
                `Blocket API request timed out after ${timeoutMs}ms for query: ${query.query}`,
              ),
            );
          }, timeoutMs);
        });

        try {
          // Race between API call and timeout
          const apiCallPromise = client.find(blocketConfig).catch((clientError: any) => {
            logger.error({
              query: query.query,
              blocketConfig,
              clientError: {
                message: clientError?.message || String(clientError),
                name: clientError?.name,
                code: clientError?.code,
                stack: clientError?.stack,
                type: typeof clientError,
              },
            });
            throw clientError;
          });


          const result = await Promise.race([apiCallPromise, timeoutPromise]);

          // Clear timeout if API call completes first
          if (timeoutHandle) clearTimeout(timeoutHandle);

          return result;
        } catch (raceError) {
          // Clear timeout on any error
          if (timeoutHandle) clearTimeout(timeoutHandle);

          logger.error({
            query: query.query,
            timeoutMs,
            raceError: {
              message: raceError instanceof Error ? raceError.message : String(raceError),
              name: raceError instanceof Error ? raceError.name : undefined,
              stack: raceError instanceof Error ? raceError.stack : undefined,
              code: (raceError as any)?.code,
            },
          });

          throw raceError;
        }
      });

    } catch (retryError) {
      logger.error({
        query: query.query,
        retryEndTime: new Date().toISOString(),
        error: {
          message: retryError instanceof Error ? retryError.message : String(retryError),
          stack: retryError instanceof Error ? retryError.stack : undefined,
          name: retryError instanceof Error ? retryError.name : undefined,
          code: (retryError as any)?.code,
        },
      });
      throw retryError;
    }

    if (!ads || !Array.isArray(ads)) {
      return {
        ads: [],
        hasMore: false,
        totalCount: 0,
      };
    }


    let transformedAds;
    try {
      // Transform Blocket ads to BaseAd format
      transformedAds = ads.map((ad) => this.transformAd(ad));
      
    } catch (transformError) {
      logger.error({
        query: query.query,
        adsCount: ads.length,
        error: {
          message: transformError instanceof Error ? transformError.message : String(transformError),
          stack: transformError instanceof Error ? transformError.stack : undefined,
        },
      });
      throw transformError;
    }

    const result = {
      ads: transformedAds,
      hasMore: ads.length >= (config?.limit || 60),
      totalCount: ads.length,
    };


    return result;
  }

  /**
   * Transform Blocket ad to BaseAd format
   */
  transformAd(blocketAd: BlocketAd): BaseAd {
    return {
      id: blocketAd.ad_id,
      title: blocketAd.subject,
      price: {
        value: blocketAd.price?.value || 0,
        currency: 'SEK',
        suffix: blocketAd.price?.suffix || 'kr',
      },
      description: blocketAd.body,
      url: blocketAd.share_url,
      images: blocketAd.images?.map((img) => img.url) || [],
      location: (blocketAd as any).location?.name || undefined,
      publishedAt: new Date((blocketAd as any).published_at || Date.now()),
      marketplace: 'BLOCKET',
      rawData: blocketAd,
    };
  }

  /**
   * Get default settings for Blocket
   */
  getDefaultSettings(): MarketplaceSettings {
    return {
      api: {
        maxRetries: 5,
        retryDelay: 3000,
        timeout: 15000,
      },
      query: {
        defaultLimit: 60,
        defaultSort: 'rel',
        listingType: 's',
        status: 'active',
        geolocation: 3,
        include: 'extend_with_shipping',
      },
    };
  }

  /**
   * Validate Blocket-specific settings
   */
  validateSettings(settings: Partial<MarketplaceSettings>): boolean {
    if (settings.api) {
      const { maxRetries, retryDelay, timeout } = settings.api;

      if (maxRetries !== undefined && (maxRetries < 1 || maxRetries > 10)) {
        throw new Error('Max retries must be between 1 and 10');
      }

      if (
        retryDelay !== undefined &&
        (retryDelay < 500 || retryDelay > 10000)
      ) {
        throw new Error('Retry delay must be between 500ms and 10s');
      }

      if (timeout !== undefined && (timeout < 5000 || timeout > 60000)) {
        throw new Error('Timeout must be between 5s and 60s');
      }
    }

    if (settings.query) {
      const { defaultLimit } = settings.query;

      if (
        defaultLimit !== undefined &&
        (defaultLimit < 1 || defaultLimit > 60)
      ) {
        throw new Error('Default limit must be between 1 and 60');
      }
    }

    return true;
  }

  /**
   * Build Blocket-specific configuration from SearchQuery and SearchConfig
   */
  private buildBlocketConfig(query: SearchQuery, config?: SearchConfig): any {
    const baseConfig: any = {
      query: query.query,
      limit: config?.limit || 60,
      sort: config?.sort || 'rel',
      listingType: 's',
      status: 'active',
      geolocation: 3,
      include: 'extend_with_shipping',
    };

    // Add price filters if specified
    if (query.minPrice !== undefined) {
      baseConfig.price_min = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      baseConfig.price_max = query.maxPrice;
    }

    // Add any Blocket-specific filters
    if (query.filters) {
      Object.assign(baseConfig, query.filters);
    }

    return baseConfig;
  }
}
