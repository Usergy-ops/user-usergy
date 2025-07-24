
/**
 * Enhanced rate limiting - now uses unified system
 * @deprecated Use src/utils/rateLimit/index.ts instead
 */

import { 
  checkEnhancedRateLimit as unifiedCheckEnhancedRateLimit,
  resetRateLimit as unifiedResetRateLimit,
  withRateLimit as unifiedWithRateLimit,
  RateLimitResult,
  RateLimitConfig,
  RATE_LIMIT_CONFIGS
} from './rateLimit';

// Re-export with enhanced naming for backward compatibility
export interface EnhancedRateLimitConfig extends RateLimitConfig {
  escalationRules?: {
    attempts: number;
    blockDurationMinutes: number;
  }[];
}

export interface EnhancedRateLimitResult extends RateLimitResult {
  escalationLevel?: number;
}

export const ENHANCED_RATE_LIMIT_CONFIGS = RATE_LIMIT_CONFIGS;

export const checkEnhancedRateLimit = unifiedCheckEnhancedRateLimit;
export const resetEnhancedRateLimit = unifiedResetRateLimit;
export const withEnhancedRateLimit = unifiedWithRateLimit;
