
/**
 * Consolidated rate limiting system - main entry point
 */

import { rateLimitManager } from './rateLimitManager';
import { getConfig } from './config';
import { RateLimitConfig, RateLimitResult } from './types';

/**
 * Check rate limit for a specific action
 */
export const checkRateLimit = async (
  identifier: string,
  action: string,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> => {
  return rateLimitManager.checkLimit(identifier, action, true, customConfig);
};

/**
 * Check rate limit with standard controls
 */
export const checkStandardRateLimit = async (
  identifier: string,
  action: string,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> => {
  return rateLimitManager.checkLimit(identifier, action, false, customConfig);
};

/**
 * Reset rate limit for a specific identifier and action
 */
export const resetRateLimit = async (
  identifier: string, 
  action: string,
  enhanced: boolean = true
): Promise<void> => {
  await rateLimitManager.resetLimit(identifier, action, enhanced);
};

/**
 * Reset multiple rate limits for an identifier
 */
export const resetMultipleRateLimits = async (
  identifier: string, 
  actions: string[],
  enhanced: boolean = true
): Promise<void> => {
  const promises = actions.map(action => resetRateLimit(identifier, action, enhanced));
  await Promise.all(promises);
};

/**
 * Rate limit decorator for functions
 */
export const withRateLimit = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action: string,
  getIdentifier: (...args: Parameters<T>) => string
): T => {
  return (async (...args: Parameters<T>) => {
    const identifier = getIdentifier(...args);
    const rateLimitResult = await checkRateLimit(identifier, action);
    
    if (!rateLimitResult.allowed) {
      const error = new Error(`Rate limit exceeded for ${action}. Try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`);
      error.name = 'RateLimitError';
      throw error;
    }
    
    return fn(...args);
  }) as T;
};

/**
 * Cleanup old rate limit records
 */
export const cleanupRateLimits = async (): Promise<void> => {
  await rateLimitManager.cleanup();
};

// Export types for external use
export type { RateLimitConfig, RateLimitResult } from './types';
export { RATE_LIMIT_CONFIGS, getConfig } from './config';
