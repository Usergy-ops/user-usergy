
/**
 * Legacy rate limiting utilities - now uses unified system
 * @deprecated Use src/utils/rateLimit/index.ts instead
 */

import { 
  checkRateLimit as unifiedCheckRateLimit,
  resetRateLimit as unifiedResetRateLimit,
  RateLimitResult
} from './rateLimit';

export interface RateLimitResult {
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
): Promise<RateLimitResult> => {
  // Convert legacy parameters to new config format
  const customConfig = {
    maxAttempts,
    windowMinutes,
    blockDurationMinutes: 60 // Default block duration
  };

  return unifiedCheckRateLimit(identifier, action, customConfig);
};

export const resetRateLimit = async (identifier: string, action: string): Promise<void> => {
  return unifiedResetRateLimit(identifier, action);
};
