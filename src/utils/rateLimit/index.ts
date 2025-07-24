
/**
 * Unified rate limiting system - main entry point
 */

import { RateLimitEngine } from './core';
import { getConfig } from './config';
import { RateLimitConfig, RateLimitResult } from './types';

// Create singleton instances
const standardEngine = new RateLimitEngine(false); // Uses rate_limits table
const enhancedEngine = new RateLimitEngine(true);  // Uses enhanced_rate_limits table

/**
 * Check rate limit for a specific action
 */
export const checkRateLimit = async (
  identifier: string,
  action: string,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> => {
  const config = customConfig || getConfig(action);
  return enhancedEngine.checkRateLimit(identifier, action, config);
};

/**
 * Check rate limit with stricter controls
 */
export const checkEnhancedRateLimit = async (
  identifier: string,
  action: string,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> => {
  const config = customConfig || {
    ...getConfig(action),
    maxAttempts: Math.floor(getConfig(action).maxAttempts * 0.7), // 30% stricter
    blockDurationMinutes: getConfig(action).blockDurationMinutes || 60
  };

  return enhancedEngine.checkRateLimit(identifier, `enhanced_${action}`, config);
};

/**
 * Reset rate limit for a specific identifier and action
 */
export const resetRateLimit = async (identifier: string, action: string): Promise<void> => {
  await enhancedEngine.resetRateLimit(identifier, action);
};

/**
 * Reset multiple rate limits for an identifier
 */
export const resetMultipleRateLimits = async (identifier: string, actions: string[]): Promise<void> => {
  const promises = actions.map(action => resetRateLimit(identifier, action));
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
  await Promise.all([
    standardEngine.cleanup(),
    enhancedEngine.cleanup()
  ]);
};

// Export types for external use
export type { RateLimitConfig, RateLimitResult } from './types';
export { RATE_LIMIT_CONFIGS, getConfig } from './config';
