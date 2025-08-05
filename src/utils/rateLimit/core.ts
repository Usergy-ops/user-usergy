/**
 * Core rate limiting engine - handles basic rate limit logic
 */

import { supabase } from '@/integrations/supabase/client';
import { RateLimitConfig, RateLimitResult, RateLimitRecord } from './types';
import { monitoring } from '../monitoring';

export class RateLimitEngine {
  private enhanced: boolean;
  
  constructor(enhanced: boolean = false) {
    this.enhanced = enhanced;
  }

  async checkRateLimit(
    identifier: string,
    action: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      const tableName = this.enhanced ? 'enhanced_rate_limits' : 'rate_limits';
      const now = new Date();
      const windowStart = new Date(now.getTime() - (config.windowMinutes * 60 * 1000));

      // Get existing record
      const { data: existingRecord, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('identifier', identifier)
        .eq('action', action)
        .gte('window_start', windowStart.toISOString())
        .maybeSingle();

      if (fetchError) {
        console.error('Rate limit fetch error:', fetchError);
        // Fail open - allow the request
        return {
          allowed: true,
          blocked: false,
          remaining: config.maxAttempts - 1,
          attemptsRemaining: config.maxAttempts - 1,
          resetTime: new Date(now.getTime() + (config.windowMinutes * 60 * 1000)),
          retryAfter: 0
        };
      }

      // Check if currently blocked
      if (existingRecord?.blocked_until && new Date(existingRecord.blocked_until) > now) {
        const blockedUntil = new Date(existingRecord.blocked_until);
        return {
          allowed: false,
          blocked: true,
          remaining: 0,
          attemptsRemaining: 0,
          resetTime: blockedUntil,
          retryAfter: Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000),
          blockedUntil
        };
      }

      let attempts = 1;
      let shouldBlock = false;
      let blockDuration = config.blockDurationMinutes || 15;

      if (existingRecord) {
        attempts = existingRecord.attempts + 1;
        
        // Check if we should block
        if (attempts > config.maxAttempts) {
          shouldBlock = true;
          
          // Apply escalation rules if enhanced mode
          if (this.enhanced && config.escalationRules) {
            for (const rule of config.escalationRules) {
              if (attempts >= rule.attempts) {
                blockDuration = rule.blockDurationMinutes;
              }
            }
          }
        }

        // Update existing record
        const updateData: any = {
          attempts,
          updated_at: now.toISOString(),
          blocked_until: shouldBlock ? 
            new Date(now.getTime() + (blockDuration * 60 * 1000)).toISOString() : 
            null
        };

        // Add enhanced fields only if in enhanced mode
        if (this.enhanced) {
          updateData.escalation_level = Math.floor(attempts / config.maxAttempts);
          updateData.total_violations = shouldBlock ? 
            ((existingRecord as any).total_violations || 0) + 1 : 
            (existingRecord as any).total_violations;
          updateData.last_violation_at = shouldBlock ? 
            now.toISOString() : 
            (existingRecord as any).last_violation_at;
        }

        const { error: updateError } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', existingRecord.id);

        if (updateError) {
          console.error('Rate limit update error:', updateError);
        }
      } else {
        // Create new record
        const insertData: any = {
          identifier,
          action,
          attempts: 1,
          window_start: windowStart.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        };

        // Add enhanced fields only if in enhanced mode
        if (this.enhanced) {
          insertData.escalation_level = 0;
          insertData.total_violations = 0;
        }

        const { error: insertError } = await supabase
          .from(tableName)
          .insert(insertData);

        if (insertError) {
          console.error('Rate limit insert error:', insertError);
        }
      }

      const resetTime = new Date(now.getTime() + (config.windowMinutes * 60 * 1000));
      const remaining = Math.max(0, config.maxAttempts - attempts);

      if (shouldBlock) {
        const blockedUntil = new Date(now.getTime() + (blockDuration * 60 * 1000));
        return {
          allowed: false,
          blocked: true,
          remaining: 0,
          attemptsRemaining: 0,
          resetTime: blockedUntil,
          retryAfter: Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000),
          blockedUntil
        };
      }

      return {
        allowed: attempts <= config.maxAttempts,
        blocked: false,
        remaining,
        attemptsRemaining: remaining,
        resetTime,
        retryAfter: 0
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      monitoring.logError(error as Error, 'rate_limit_check', { identifier, action });
      
      // Fail open - allow the request
      return {
        allowed: true,
        blocked: false,
        remaining: config.maxAttempts - 1,
        attemptsRemaining: config.maxAttempts - 1,
        resetTime: new Date(Date.now() + (config.windowMinutes * 60 * 1000)),
        retryAfter: 0
      };
    }
  }

  async resetRateLimit(identifier: string, action: string): Promise<void> {
    try {
      const tableName = this.enhanced ? 'enhanced_rate_limits' : 'rate_limits';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('identifier', identifier)
        .eq('action', action);

      if (error) {
        console.error('Rate limit reset error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const tableName = this.enhanced ? 'enhanced_rate_limits' : 'rate_limits';
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24); // Keep records for 24 hours

      const { error } = await supabase
        .from(tableName)
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Rate limit cleanup error:', error);
      } else {
        console.log(`Cleaned up old ${tableName} records`);
      }
    } catch (error) {
      console.error('Failed to cleanup rate limits:', error);
    }
  }
}
