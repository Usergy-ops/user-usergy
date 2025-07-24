
/**
 * Legacy rate limiting utilities - now uses consolidated system
 * @deprecated Use src/utils/rateLimit/index.ts instead
 */

import { 
  checkStandardRateLimit,
  resetRateLimit as unifiedResetRateLimit,
  RateLimitResult as UnifiedRateLimitResult
} from './rateLimit';

export interface LegacyRateLimitResult {
  allowed: boolean;
  attemptsRemaining: number;
  resetTime: Date;
  blocked: boolean;
  blockedUntil?: Date;
}

export const checkRateLimit = async (
  identifier: string,
  action: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<LegacyRateLimitResult> => {
  // Convert legacy parameters to new config format
  const customConfig = {
    maxAttempts,
    windowMinutes,
    blockDurationMinutes: 60 // Default block duration
  };

  const result = await checkStandardRateLimit(identifier, action, customConfig);
  
  // Convert to legacy format
  return {
    allowed: result.allowed,
    attemptsRemaining: result.attemptsRemaining,
    resetTime: result.resetTime,
    blocked: result.blocked,
    blockedUntil: result.blockedUntil
  };
};

export const resetRateLimit = async (identifier: string, action: string): Promise<void> => {
  return unifiedResetRateLimit(identifier, action, false); // Use standard rate limiting for legacy compatibility
};
