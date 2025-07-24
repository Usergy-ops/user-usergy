
/**
 * Rate limiting utilities
 */

import { supabase } from '@/integrations/supabase/client';

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
  try {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
    
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
      console.error('Rate limit check error:', error);
      return {
        allowed: true,
        attemptsRemaining: maxAttempts - 1,
        resetTime: new Date(Date.now() + windowMinutes * 60 * 1000),
        blocked: false
      };
    }

    const now = new Date();
    
    // Check if currently blocked
    if (existingRecord?.blocked_until && new Date(existingRecord.blocked_until) > now) {
      return {
        allowed: false,
        attemptsRemaining: 0,
        resetTime: new Date(existingRecord.blocked_until),
        blocked: true,
        blockedUntil: new Date(existingRecord.blocked_until)
      };
    }

    if (existingRecord) {
      const newAttempts = existingRecord.attempts + 1;
      const isBlocked = newAttempts > maxAttempts;
      
      // Update existing record
      await supabase
        .from('rate_limits')
        .update({
          attempts: newAttempts,
          blocked_until: isBlocked ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null, // Block for 1 hour
          updated_at: now.toISOString()
        })
        .eq('id', existingRecord.id);

      return {
        allowed: !isBlocked,
        attemptsRemaining: Math.max(0, maxAttempts - newAttempts),
        resetTime: new Date(existingRecord.window_start).getTime() + windowMinutes * 60 * 1000 > now.getTime() 
          ? new Date(new Date(existingRecord.window_start).getTime() + windowMinutes * 60 * 1000)
          : new Date(Date.now() + windowMinutes * 60 * 1000),
        blocked: isBlocked,
        blockedUntil: isBlocked ? new Date(Date.now() + 60 * 60 * 1000) : undefined
      };
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

      return {
        allowed: true,
        attemptsRemaining: maxAttempts - 1,
        resetTime: new Date(Date.now() + windowMinutes * 60 * 1000),
        blocked: false
      };
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Default to allowing the request if rate limiting fails
    return {
      allowed: true,
      attemptsRemaining: maxAttempts - 1,
      resetTime: new Date(Date.now() + windowMinutes * 60 * 1000),
      blocked: false
    };
  }
};

export const resetRateLimit = async (identifier: string, action: string): Promise<void> => {
  try {
    await supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', identifier)
      .eq('action', action);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
};
