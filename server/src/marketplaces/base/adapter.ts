import type {
  BaseAd,
  SearchQuery,
  SearchConfig,
  SearchResult,
  MarketplaceType,
  MarketplaceSettings,
  MarketplaceCapabilities,
} from './types';
import logger from '@/integrations/logger';

/**
 * Abstract base class for marketplace adapters
 * All marketplace implementations must extend this class
 */
export abstract class BaseMarketplaceAdapter {
  abstract readonly type: MarketplaceType;
  abstract readonly name: string;
  abstract readonly capabilities: MarketplaceCapabilities;

  /**
   * Search for ads on the marketplace
   * @param query - Search query and filters
   * @param config - Search configuration
   * @returns Promise resolving to search results
   */
  abstract search(
    query: SearchQuery,
    config?: SearchConfig,
  ): Promise<SearchResult>;

  /**
   * Get default settings for this marketplace
   * @returns Default marketplace settings
   */
  abstract getDefaultSettings(): MarketplaceSettings;

  /**
   * Validate marketplace-specific settings
   * @param settings - Settings to validate
   * @returns True if valid, throws error if invalid
   */
  abstract validateSettings(settings: Partial<MarketplaceSettings>): boolean;

  /**
   * Transform marketplace-specific ad data to BaseAd format
   * @param rawAd - Raw ad data from marketplace
   * @returns Standardized ad format
   */
  abstract transformAd(rawAd: any): BaseAd;

  /**
   * Get marketplace-specific error retry logic
   * @param error - Error that occurred
   * @returns True if error is retryable
   */
  isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorCause = (error as any)?.cause?.message?.toLowerCase() || '';
    const errorCode = (error as any)?.code?.toLowerCase() || '';

    const retryablePatterns = [
      'fetch failed',
      'timeout',
      'connection timeout',
      'connect timeout',
      'econnreset',
      'enotfound',
      'econnrefused',
      'network error',
      'und_err_connect_timeout',
      'connecttimeouterror',
      'socket hang up',
      'request timeout',
      'response timeout',
    ];

    const retryableNames = [
      'FetchError',
      'ConnectTimeoutError',
      'AbortError',
      'TimeoutError',
    ];

    const retryableCodes = [
      'UND_ERR_CONNECT_TIMEOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENETUNREACH',
      'EHOSTUNREACH',
    ];

    const isRetryable =
      retryablePatterns.some(pattern =>
        errorMessage.includes(pattern) || errorCause.includes(pattern)
      ) ||
      retryableNames.includes(error.name) ||
      retryableCodes.includes((error as any)?.code);

    logger.debug({
      marketplace: this.type,
      isRetryable,
      errorAnalysis: {
        message: error.message,
        name: error.name,
        code: (error as any)?.code,
        cause: (error as any)?.cause,
        stack: error.stack?.split('\n').slice(0, 3), // First 3 lines of stack
      },
    });

    return isRetryable;
  }

  /**
   * Perform retry logic with exponential backoff
   * @param fn - Function to retry
   * @param maxRetries - Maximum number of retries
   * @param baseDelay - Base delay between retries
   * @returns Result of function or throws after max retries
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    baseDelay: number = 3000,
  ): Promise<T> {

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {

      try {
        const result = await fn();
        
        if (attempt > 0) {
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.error({
          marketplace: this.type,
          attempt: attempt + 1,
          maxRetries,
          error: {
            message: lastError.message,
            stack: lastError.stack,
            name: lastError.name,
            code: (lastError as any)?.code,
          },
          isRetryableError: this.isRetryableError(lastError),
        });

        if (!this.isRetryableError(lastError) || attempt === maxRetries - 1) {
          logger.error({
            marketplace: this.type,
            attempt: attempt + 1,
            maxRetries,
            isRetryableError: this.isRetryableError(lastError),
            finalError: {
              message: lastError.message,
              stack: lastError.stack,
              name: lastError.name,
              code: (lastError as any)?.code,
            },
          });
          throw lastError;
        }

        // Calculate progressive delay with jitter
        const baseDelayMultiplier = Math.pow(1.8, attempt);
        const jitter = 0.8 + Math.random() * 0.4;
        const delay = Math.min(baseDelay * baseDelayMultiplier * jitter, 30000);


        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Format price for display
   * @param price - Price object
   * @returns Formatted price string
   */
  formatPrice(price: BaseAd['price']): string {
    return `${price.value}${price.suffix || ''} ${price.currency}`;
  }

  /**
   * Get cache key for a search query
   * @param query - Search query
   * @returns Cache key string
   */
  getCacheKey(query: SearchQuery): string {
    return `${this.type}:${JSON.stringify(query)}`;
  }
}
