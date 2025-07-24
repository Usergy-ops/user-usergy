
/**
 * Enhanced rate limiting system with improved tracking and blocking
 */

import { supabase } from '@/integrations/supabase/client';
import { monitoring } from './monitoring';
import type { Json } from '@/integrations/supabase/types';

export interface EnhancedRateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes?: number;
  escalationRules?: {
    attempts: number;
    blockDurationMinutes: number;
  }[];
}

export interface EnhancedRateLimitResult {
  allowed: boolean;
  attemptsRemaining: number;
  resetTime: Date;
  blocked: boolean;
  blockedUntil?: Date;
  escalationLevel?: number;
}

// Enhanced type guard for metadata objects
const isMetadataObject = (value: Json): value is Record<string, Json> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

// Safe accessor for nested Json properties
const getJsonProperty = (obj: Json, key: string): Json | undefined => {
  if (isMetadataObject(obj)) {
    return obj[key];
  }
  return undefined;
};

// Safe number extraction from Json
const getNumberFromJson = (value: Json): number => {
  if (typeof value === 'number') {
    return value;
  }
  return 0;
};

// Enhanced rate limit configurations with escalation
export const ENHANCED_RATE_LIMIT_CONFIGS: Record<string, EnhancedRateLimitConfig> = {
  // Authentication related with progressive blocking
  signup: { 
    maxAttempts: 5, 
    windowMinutes: 60, 
    blockDurationMinutes: 15,
    escalationRules: [
      { attempts: 10, blockDurationMinutes: 60 },
      { attempts: 15, blockDurationMinutes: 240 }
    ]
  },
  signin: { 
    maxAttempts: 10, 
    windowMinutes: 60, 
    blockDurationMinutes: 15,
    escalationRules: [
      { attempts: 20, blockDurationMinutes: 60 },
      { attempts: 30, blockDurationMinutes: 180 }
    ]
  },
  otp_verify: { 
    maxAttempts: 5, 
    windowMinutes: 10, 
    blockDurationMinutes: 15,
    escalationRules: [
      { attempts: 10, blockDurationMinutes: 60 }
    ]
  },
  otp_resend: { 
    maxAttempts: 3, 
    windowMinutes: 10, 
    blockDurationMinutes: 15 
  },
  password_reset: { 
    maxAttempts: 3, 
    windowMinutes: 60, 
    blockDurationMinutes: 30 
  },

  // Profile related
  profile_update: { maxAttempts: 20, windowMinutes: 60, blockDurationMinutes: 5 },
  profile_load: { maxAttempts: 100, windowMinutes: 60, blockDurationMinutes: 1 },
  file_upload: { maxAttempts: 10, windowMinutes: 60, blockDurationMinutes: 10 },

  // API calls
  api_call: { maxAttempts: 100, windowMinutes: 60, blockDurationMinutes: 5 },
  database_query: { maxAttempts: 200, windowMinutes: 60, blockDurationMinutes: 2 },

  // Default fallback
  default: { maxAttempts: 30, windowMinutes: 60, blockDurationMinutes: 5 }
};

export const checkEnhancedRateLimit = async (
  identifier: string,
  action: string,
  customConfig?: EnhancedRateLimitConfig
): Promise<EnhancedRateLimitResult> => {
  const startTime = performance.now();
  
  try {
    const config = customConfig || ENHANCED_RATE_LIMIT_CONFIGS[action] || ENHANCED_RATE_LIMIT_CONFIGS.default;
    
    monitoring.startTiming(`enhanced_rate_limit_check_${action}`);
    
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);
    
    const windowEnd = new Date();
    windowEnd.setMinutes(windowEnd.getMinutes() + config.windowMinutes);
    
    // Check for existing rate limit record
    const { data: existingRecord, error } = await supabase
      .from('enhanced_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      monitoring.logError(error, 'enhanced_rate_limit_check_error', {
        identifier,
        action,
        config
      });
      
      // Default to allowing the request if rate limiting fails
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
      // Safely extract metadata with improved type guards
      const metadata = isMetadataObject(existingRecord.metadata) ? existingRecord.metadata : {};
      const escalationLevelValue = getJsonProperty(metadata, 'escalationLevel');
      const escalationLevel = getNumberFromJson(escalationLevelValue);
      
      const result = {
        allowed: false,
        attemptsRemaining: 0,
        resetTime: new Date(existingRecord.blocked_until),
        blocked: true,
        blockedUntil: new Date(existingRecord.blocked_until),
        escalationLevel
      };
      
      monitoring.recordMetric('enhanced_rate_limit_blocked', 1, {
        action,
        identifier_type: identifier.includes('@') ? 'email' : 'user_id',
        escalation_level: escalationLevel.toString()
      });
      
      return result;
    }

    if (existingRecord) {
      const newAttempts = existingRecord.attempts + 1;
      let blockDuration = config.blockDurationMinutes || 60;
      
      // Safely extract metadata with improved type guards
      const existingMetadata = isMetadataObject(existingRecord.metadata) ? existingRecord.metadata : {};
      const escalationLevelValue = getJsonProperty(existingMetadata, 'escalationLevel');
      let escalationLevel = getNumberFromJson(escalationLevelValue);
      
      // Check for escalation rules
      if (config.escalationRules) {
        for (const rule of config.escalationRules) {
          if (newAttempts >= rule.attempts) {
            blockDuration = rule.blockDurationMinutes;
            escalationLevel = Math.max(escalationLevel, config.escalationRules.indexOf(rule) + 1);
          }
        }
      }
      
      const isBlocked = newAttempts > config.maxAttempts;
      const blockedUntil = isBlocked ? new Date(Date.now() + blockDuration * 60 * 1000) : null;
      
      // Update existing record
      await supabase
        .from('enhanced_rate_limits')
        .update({
          attempts: newAttempts,
          window_end: windowEnd.toISOString(),
          blocked_until: blockedUntil?.toISOString() || null,
          metadata: {
            ...existingMetadata,
            escalationLevel,
            lastAttempt: now.toISOString()
          },
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
        blockedUntil: blockedUntil || undefined,
        escalationLevel
      };

      monitoring.recordMetric('enhanced_rate_limit_check', 1, {
        action,
        allowed: (!isBlocked).toString(),
        attempts_remaining: result.attemptsRemaining.toString(),
        escalation_level: escalationLevel.toString()
      });
      
      return result;
    } else {
      // Create new record
      await supabase
        .from('enhanced_rate_limits')
        .insert({
          identifier,
          action,
          attempts: 1,
          window_start: now.toISOString(),
          window_end: windowEnd.toISOString(),
          metadata: {
            escalationLevel: 0,
            firstAttempt: now.toISOString()
          }
        });

      const result = {
        allowed: true,
        attemptsRemaining: config.maxAttempts - 1,
        resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000),
        blocked: false,
        escalationLevel: 0
      };

      monitoring.recordMetric('enhanced_rate_limit_check', 1, {
        action,
        allowed: 'true',
        attempts_remaining: result.attemptsRemaining.toString(),
        escalation_level: '0'
      });
      
      return result;
    }
  } catch (error) {
    monitoring.logError(error as Error, 'enhanced_rate_limiting_error', {
      identifier,
      action,
      config: customConfig
    });
    
    // Default to allowing the request if rate limiting fails
    return {
      allowed: true,
      attemptsRemaining: (customConfig || ENHANCED_RATE_LIMIT_CONFIGS[action] || ENHANCED_RATE_LIMIT_CONFIGS.default).maxAttempts - 1,
      resetTime: new Date(Date.now() + (customConfig || ENHANCED_RATE_LIMIT_CONFIGS[action] || ENHANCED_RATE_LIMIT_CONFIGS.default).windowMinutes * 60 * 1000),
      blocked: false
    };
  } finally {
    monitoring.endTiming(`enhanced_rate_limit_check_${action}`);
    
    const endTime = performance.now();
    monitoring.recordMetric('enhanced_rate_limit_check_duration', endTime - startTime, {
      action,
      identifier_type: identifier.includes('@') ? 'email' : 'user_id'
    });
  }
};

// Reset enhanced rate limit
export const resetEnhancedRateLimit = async (identifier: string, action: string): Promise<void> => {
  try {
    await supabase
      .from('enhanced_rate_limits')
      .delete()
      .eq('identifier', identifier)
      .eq('action', action);
      
    monitoring.info(`Enhanced rate limit reset for ${action}`, 'enhanced_rate_limiting', {
      identifier,
      action
    });
  } catch (error) {
    monitoring.logError(error as Error, 'reset_enhanced_rate_limit_error', {
      identifier,
      action
    });
  }
};

// Enhanced rate limit decorator
export const withEnhancedRateLimit = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action: string,
  getIdentifier: (...args: Parameters<T>) => string
): T => {
  return (async (...args: Parameters<T>) => {
    const identifier = getIdentifier(...args);
    const rateLimitResult = await checkEnhancedRateLimit(identifier, action);
    
    if (!rateLimitResult.allowed) {
      const error = new Error(`Rate limit exceeded for ${action}. ${rateLimitResult.blocked ? 'Blocked' : 'Try again'} in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`);
      error.name = 'EnhancedRateLimitError';
      throw error;
    }
    
    return fn(...args);
  }) as T;
};
