
/**
 * Consistent rate limiting across all application endpoints
 */

import { supabase } from '@/integrations/supabase/client';
import { monitoring } from './monitoring';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  attemptsRemaining: number;
  resetTime: Date;
  blocked: boolean;
  blockedUntil?: Date;
}

// Standardized rate limit configurations
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication related
  signup: { maxAttempts: 5, windowMinutes: 60, blockDurationMinutes: 15 },
  signin: { maxAttempts: 10, windowMinutes: 60, blockDurationMinutes: 15 },
  otp_verify: { maxAttempts: 5, windowMinutes: 10, blockDurationMinutes: 15 },
  otp_resend: { maxAttempts: 3, windowMinutes: 10, blockDurationMinutes: 15 },
  password_reset: { maxAttempts: 3, windowMinutes: 60, blockDurationMinutes: 30 },

  // Profile related
  profile_update: { maxAttempts: 20, windowMinutes: 60, blockDurationMinutes: 5 },
  profile_load: { maxAttempts: 100, windowMinutes: 60, blockDurationMinutes: 1 },
  file_upload: { maxAttempts: 10, windowMinutes: 60, blockDurationMinutes: 10 },

  // API calls
  api_call: { maxAttempts: 100, windowMinutes: 60, blockDurationMinutes: 5 },
  database_query: { maxAttempts: 200, windowMinutes: 60, blockDurationMinutes: 2 },

  // Edge function calls
  edge_function: { maxAttempts: 50, windowMinutes: 60, blockDurationMinutes: 5 },

  // Default fallback
  default: { maxAttempts: 30, windowMinutes: 60, blockDurationMinutes: 5 }
};

// Enhanced rate limiting with monitoring
export const checkRateLimit = async (
  identifier: string,
  action: string,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> => {
  const startTime = performance.now();
  
  try {
    // Get configuration
    const config = customConfig || RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.default;
    
    monitoring.startTiming(`rate_limit_check_${action}`);
    
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);
    
    // Check existing rate limit record
    const { data: existingRecord, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      // Log error but don't block the request
      monitoring.logError(error, 'rate_limit_check_error', {
        identifier,
        action,
        config
      });
      
      return {
        allowed: true,
        attemptsRemaining: config.maxAttempts - 1,
        resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000),
        blocked: false
      };
    }

    const now = new Date();
    
    // Check if currently blocked
    if (existingRecord?.blocked_until && new Date(existingRecord.blocked_until) > now) {
      const result = {
        allowed: false,
        attemptsRemaining: 0,
        resetTime: new Date(existingRecord.blocked_until),
        blocked: true,
        blockedUntil: new Date(existingRecord.blocked_until)
      };
      
      monitoring.monitorRateLimit(identifier, action, false, 0);
      return result;
    }

    if (existingRecord) {
      const newAttempts = existingRecord.attempts + 1;
      const isBlocked = newAttempts > config.maxAttempts;
      const blockDuration = config.blockDurationMinutes || 60;
      
      // Update existing record
      await supabase
        .from('rate_limits')
        .update({
          attempts: newAttempts,
          blocked_until: isBlocked ? new Date(Date.now() + blockDuration * 60 * 1000).toISOString() : null,
          updated_at: now.toISOString()
        })
        .eq('id', existingRecord.id);

      const result = {
        allowed: !isBlocked,
        attemptsRemaining: Math.max(0, config.maxAttempts - newAttempts),
        resetTime: new Date(existingRecord.window_start).getTime() + config.windowMinutes * 60 * 1000 > now.getTime() 
          ? new Date(new Date(existingRecord.window_start).getTime() + config.windowMinutes * 60 * 1000)
          : new Date(Date.now() + config.windowMinutes * 60 * 1000),
        blocked: isBlocked,
        blockedUntil: isBlocked ? new Date(Date.now() + blockDuration * 60 * 1000) : undefined
      };

      monitoring.monitorRateLimit(identifier, action, !isBlocked, result.attemptsRemaining);
      return result;
    } else {
      // Create new record
      await supabase
        .from('rate_limits')
        .insert({
          identifier,
          action,
          attempts: 1,
          window_start: now.toISOString()
        });

      const result = {
        allowed: true,
        attemptsRemaining: config.maxAttempts - 1,
        resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000),
        blocked: false
      };

      monitoring.monitorRateLimit(identifier, action, true, result.attemptsRemaining);
      return result;
    }
  } catch (error) {
    monitoring.logError(error as Error, 'rate_limiting_error', {
      identifier,
      action,
      config: customConfig
    });
    
    // Default to allowing the request if rate limiting fails
    return {
      allowed: true,
      attemptsRemaining: (customConfig || RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.default).maxAttempts - 1,
      resetTime: new Date(Date.now() + (customConfig || RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.default).windowMinutes * 60 * 1000),
      blocked: false
    };
  } finally {
    monitoring.endTiming(`rate_limit_check_${action}`);
    
    const endTime = performance.now();
    monitoring.recordMetric('rate_limit_check_duration', endTime - startTime, {
      action,
      identifier_type: identifier.includes('@') ? 'email' : 'user_id'
    });
  }
};

// Reset rate limit for a specific identifier and action
export const resetRateLimit = async (identifier: string, action: string): Promise<void> => {
  try {
    await supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', identifier)
      .eq('action', action);
      
    monitoring.info(`Rate limit reset for ${action}`, 'rate_limiting', {
      identifier,
      action
    });
  } catch (error) {
    monitoring.logError(error as Error, 'reset_rate_limit_error', {
      identifier,
      action
    });
  }
};

// Batch reset rate limits for multiple actions
export const resetMultipleRateLimits = async (identifier: string, actions: string[]): Promise<void> => {
  const promises = actions.map(action => resetRateLimit(identifier, action));
  
  try {
    await Promise.all(promises);
    monitoring.info(`Multiple rate limits reset`, 'rate_limiting', {
      identifier,
      actions,
      count: actions.length
    });
  } catch (error) {
    monitoring.logError(error as Error, 'reset_multiple_rate_limits_error', {
      identifier,
      actions
    });
  }
};

// Get current rate limit status
export const getRateLimitStatus = async (identifier: string, action: string): Promise<RateLimitResult | null> => {
  try {
    const config = RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.default;
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);
    
    const { data: record, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!record) {
      return {
        allowed: true,
        attemptsRemaining: config.maxAttempts,
        resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000),
        blocked: false
      };
    }

    const now = new Date();
    const isBlocked = record.blocked_until && new Date(record.blocked_until) > now;
    
    return {
      allowed: !isBlocked && record.attempts < config.maxAttempts,
      attemptsRemaining: Math.max(0, config.maxAttempts - record.attempts),
      resetTime: new Date(record.window_start).getTime() + config.windowMinutes * 60 * 1000 > now.getTime() 
        ? new Date(new Date(record.window_start).getTime() + config.windowMinutes * 60 * 1000)
        : new Date(Date.now() + config.windowMinutes * 60 * 1000),
      blocked: !!isBlocked,
      blockedUntil: isBlocked ? new Date(record.blocked_until) : undefined
    };
  } catch (error) {
    monitoring.logError(error as Error, 'get_rate_limit_status_error', {
      identifier,
      action
    });
    return null;
  }
};

// Rate limit decorator for functions
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
