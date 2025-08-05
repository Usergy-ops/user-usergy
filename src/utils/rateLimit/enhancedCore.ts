
/**
 * Enhanced rate limiting core that integrates with the updated database functions
 * Includes progressive rate limiting and escalation support
 */

import { supabase } from '@/integrations/supabase/client';
import { RateLimitConfig, RateLimitResult } from './types';
import { handleDatabaseError } from '../enhancedMonitoring';
import { recordSystemMetric as monitoringMetric } from '../enhancedMonitoring';

export interface ProgressiveRateLimitResult extends RateLimitResult {
  escalationLevel: number;
  totalViolations: number;
  progressiveConfig: {
    maxAttempts: number;
    windowMinutes: number;
  };
}

// Type guard for progressive rate limit data
function isValidProgressiveData(data: any): data is {
  max_attempts: number;
  window_minutes: number;
  escalation_level: number;
  total_violations: number;
} {
  return data &&
    typeof data.max_attempts === 'number' &&
    typeof data.window_minutes === 'number' &&
    typeof data.escalation_level === 'number' &&
    typeof data.total_violations === 'number';
}

export class EnhancedRateLimitEngine {
  private useEnhancedTable: boolean;

  constructor(useEnhancedTable: boolean = true) {
    this.useEnhancedTable = useEnhancedTable;
  }

  async checkProgressiveRateLimit(
    identifier: string,
    action: string,
    baseConfig: RateLimitConfig
  ): Promise<ProgressiveRateLimitResult> {
    try {
      // Get progressive rate limit configuration from the database function
      const { data: progressiveData, error: progressiveError } = await supabase
        .rpc('apply_progressive_rate_limit', {
          identifier_param: identifier,
          action_param: action,
          base_attempts: baseConfig.maxAttempts,
          base_window_minutes: baseConfig.windowMinutes
        });

      if (progressiveError) {
        throw new Error(`Progressive rate limit calculation failed: ${progressiveError.message}`);
      }

      if (!isValidProgressiveData(progressiveData)) {
        throw new Error('Invalid progressive rate limit data received from database');
      }

      // Apply the progressive configuration
      const progressiveConfig: RateLimitConfig = {
        maxAttempts: progressiveData.max_attempts,
        windowMinutes: progressiveData.window_minutes,
        blockDurationMinutes: baseConfig.blockDurationMinutes
      };

      // Check rate limit with progressive configuration
      const result = await this.checkRateLimit(identifier, action, progressiveConfig);

      // Record progressive rate limiting metrics
      await monitoringMetric({
        metric_name: 'progressive_rate_limit_check',
        metric_value: 1,
        metric_type: 'counter',
        labels: {
          action,
          escalation_level: progressiveData.escalation_level,
          total_violations: progressiveData.total_violations,
          blocked: result.blocked.toString()
        }
      });

      return {
        ...result,
        escalationLevel: progressiveData.escalation_level,
        totalViolations: progressiveData.total_violations,
        progressiveConfig: {
          maxAttempts: progressiveData.max_attempts,
          windowMinutes: progressiveData.window_minutes
        }
      };

    } catch (error) {
      console.error('Error in progressive rate limit check:', error);
      await handleDatabaseError(
        error as Error,
        'enhanced_rate_limits',
        'progressive_check',
        identifier
      );

      // Fallback to standard rate limiting
      const fallbackResult = await this.checkRateLimit(identifier, action, baseConfig);
      return {
        ...fallbackResult,
        escalationLevel: 0,
        totalViolations: 0,
        progressiveConfig: {
          maxAttempts: baseConfig.maxAttempts,
          windowMinutes: baseConfig.windowMinutes
        }
      };
    }
  }

  async checkRateLimit(
    identifier: string,
    action: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      const tableName = this.useEnhancedTable ? 'enhanced_rate_limits' : 'rate_limits';
      const now = new Date();
      const windowStart = new Date(now.getTime() - (config.windowMinutes * 60 * 1000));

      // Check existing rate limit record
      const { data: existing, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .eq('identifier', identifier)
        .eq('action', action)
        .gte('window_start', windowStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selectError) {
        throw new Error(`Rate limit check failed: ${selectError.message}`);
      }

      // Check if currently blocked
      if (existing?.blocked_until && new Date(existing.blocked_until) > now) {
        return {
          allowed: false,
          blocked: true,
          remaining: 0,
          attemptsRemaining: 0,
          resetTime: new Date(existing.blocked_until),
          retryAfter: Math.ceil((new Date(existing.blocked_until).getTime() - now.getTime()) / 1000)
        };
      }

      // Calculate attempts in current window
      const currentAttempts = existing ? existing.attempts + 1 : 1;
      const remaining = Math.max(0, config.maxAttempts - currentAttempts);
      const isBlocked = currentAttempts > config.maxAttempts;

      // Calculate reset time and block duration
      const resetTime = isBlocked && config.blockDurationMinutes
        ? new Date(now.getTime() + (config.blockDurationMinutes * 60 * 1000))
        : new Date(windowStart.getTime() + (config.windowMinutes * 60 * 1000));

      const retryAfter = isBlocked && config.blockDurationMinutes
        ? config.blockDurationMinutes * 60
        : Math.ceil((resetTime.getTime() - now.getTime()) / 1000);

      // Update or insert rate limit record
      const updateData: any = {
        identifier,
        action,
        attempts: currentAttempts,
        window_start: existing ? existing.window_start : now.toISOString(),
        blocked_until: isBlocked && config.blockDurationMinutes ? resetTime.toISOString() : null,
        updated_at: now.toISOString()
      };

      // Add enhanced fields if using enhanced table
      if (this.useEnhancedTable) {
        updateData.window_end = resetTime.toISOString();
        updateData.metadata = {
          config,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          timestamp: now.toISOString()
        };

        // Update escalation tracking if blocked and record exists
        if (isBlocked && existing && 'escalation_level' in existing && 'total_violations' in existing) {
          updateData.escalation_level = (existing.escalation_level || 0) + 1;
          updateData.total_violations = (existing.total_violations || 0) + 1;
          updateData.last_violation_at = now.toISOString();
        }
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', existing.id);

        if (updateError) {
          throw new Error(`Rate limit update failed: ${updateError.message}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({
            ...updateData,
            id: crypto.randomUUID(),
            created_at: now.toISOString()
          });

        if (insertError) {
          throw new Error(`Rate limit insert failed: ${insertError.message}`);
        }
      }

      // Record rate limiting metrics
      await monitoringMetric({
        metric_name: 'rate_limit_check',
        metric_value: 1,
        metric_type: 'counter',
        labels: {
          action,
          allowed: (!isBlocked).toString(),
          blocked: isBlocked.toString(),
          table: tableName
        }
      });

      return {
        allowed: !isBlocked,
        blocked: isBlocked,
        remaining,
        attemptsRemaining: remaining,
        resetTime,
        retryAfter
      };

    } catch (error) {
      console.error('Error in rate limit check:', error);
      await handleDatabaseError(
        error as Error,
        this.useEnhancedTable ? 'enhanced_rate_limits' : 'rate_limits',
        'check',
        identifier
      );

      // Return permissive result on error to avoid blocking legitimate requests
      return {
        allowed: true,
        blocked: false,
        remaining: config.maxAttempts,
        attemptsRemaining: config.maxAttempts,
        resetTime: new Date(Date.now() + (config.windowMinutes * 60 * 1000)),
        retryAfter: 0
      };
    }
  }

  async resetRateLimit(identifier: string, action: string): Promise<void> {
    try {
      const tableName = this.useEnhancedTable ? 'enhanced_rate_limits' : 'rate_limits';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('identifier', identifier)
        .eq('action', action);

      if (error) {
        throw new Error(`Rate limit reset failed: ${error.message}`);
      }

      await monitoringMetric({
        metric_name: 'rate_limit_reset',
        metric_value: 1,
        metric_type: 'counter',
        labels: { action, table: tableName }
      });

    } catch (error) {
      console.error('Error resetting rate limit:', error);
      await handleDatabaseError(
        error as Error,
        this.useEnhancedTable ? 'enhanced_rate_limits' : 'rate_limits',
        'reset',
        identifier
      );
    }
  }

  async cleanup(): Promise<void> {
    try {
      const cleanupFunction = this.useEnhancedTable
        ? 'cleanup_old_enhanced_rate_limits'
        : 'cleanup_old_rate_limits';

      const { error } = await supabase.rpc(cleanupFunction);

      if (error) {
        throw new Error(`Rate limit cleanup failed: ${error.message}`);
      }

      await monitoringMetric({
        metric_name: 'rate_limit_cleanup',
        metric_value: 1,
        metric_type: 'counter',
        labels: { table: this.useEnhancedTable ? 'enhanced' : 'standard' }
      });

    } catch (error) {
      console.error('Error during rate limit cleanup:', error);
      await handleDatabaseError(
        error as Error,
        this.useEnhancedTable ? 'enhanced_rate_limits' : 'rate_limits',
        'cleanup'
      );
    }
  }
}

export const enhancedRateLimitEngine = new EnhancedRateLimitEngine(true);
export const standardRateLimitEngine = new EnhancedRateLimitEngine(false);
