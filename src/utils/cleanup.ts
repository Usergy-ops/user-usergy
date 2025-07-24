
/**
 * Cleanup utilities for maintaining database hygiene
 */

import { supabase } from '@/integrations/supabase/client';

export const cleanupExpiredOTP = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('cleanup_expired_otp');
    
    if (error) {
      console.error('Error cleaning up expired OTP records:', error);
    } else {
      console.log('Expired OTP records cleaned up successfully');
    }
  } catch (error) {
    console.error('Exception during OTP cleanup:', error);
  }
};

export const cleanupOldRateLimits = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('cleanup_old_rate_limits');
    
    if (error) {
      console.error('Error cleaning up old rate limit records:', error);
    } else {
      console.log('Old rate limit records cleaned up successfully');
    }
  } catch (error) {
    console.error('Exception during rate limit cleanup:', error);
  }
};

// Run cleanup periodically (every 6 hours)
export const scheduleCleanup = (): void => {
  const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  
  setInterval(async () => {
    await cleanupExpiredOTP();
    await cleanupOldRateLimits();
  }, CLEANUP_INTERVAL);
};
