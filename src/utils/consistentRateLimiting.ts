
/**
 * Consistent rate limiting - now uses unified system
 * @deprecated Use src/utils/rateLimit/index.ts instead
 */

import { 
  checkRateLimit as unifiedCheckRateLimit,
  checkEnhancedRateLimit as unifiedCheckEnhancedRateLimit,
  resetRateLimit as unifiedResetRateLimit,
  resetMultipleRateLimits as unifiedResetMultipleRateLimits,
  withRateLimit as unifiedWithRateLimit,
  RateLimitResult,
  RateLimitConfig,
  RATE_LIMIT_CONFIGS
} from './rateLimit';

// Re-export types and functions for backward compatibility
export type { RateLimitConfig, RateLimitResult };
export { RATE_LIMIT_CONFIGS };

export const checkRateLimit = unifiedCheckRateLimit;
export const checkEnhancedRateLimit = unifiedCheckEnhancedRateLimit;
export const resetRateLimit = unifiedResetRateLimit;
export const resetMultipleRateLimits = unifiedResetMultipleRateLimits;
export const withRateLimit = unifiedWithRateLimit;

// Legacy function names for backward compatibility
export const getRateLimitStatus = async (identifier: string, action: string): Promise<RateLimitResult | null> => {
  try {
    const result = await checkRateLimit(identifier, action);
    return result;
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return null;
  }
};
