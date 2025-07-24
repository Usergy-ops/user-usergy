
/**
 * Cleanup utilities for maintaining database hygiene with enhanced structure
 */

import { supabase } from '@/integrations/supabase/client';
import { handleCentralizedError } from './centralizedErrorHandling';

export const cleanupExpiredOTP = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('cleanup_expired_otp');
    
    if (error) {
      await handleCentralizedError(new Error(error.message), 'cleanup_expired_otp');
      console.error('Error cleaning up expired OTP records:', error);
    } else {
      console.log('Expired OTP records cleaned up successfully');
    }
  } catch (error) {
    await handleCentralizedError(error as Error, 'cleanup_expired_otp');
    console.error('Exception during OTP cleanup:', error);
  }
};

export const cleanupOldRateLimits = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('cleanup_old_rate_limits');
    
    if (error) {
      await handleCentralizedError(new Error(error.message), 'cleanup_old_rate_limits');
      console.error('Error cleaning up old rate limit records:', error);
    } else {
      console.log('Old rate limit records cleaned up successfully');
    }
  } catch (error) {
    await handleCentralizedError(error as Error, 'cleanup_old_rate_limits');
    console.error('Exception during rate limit cleanup:', error);
  }
};

export const cleanupEnhancedRateLimits = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('cleanup_old_enhanced_rate_limits');
    
    if (error) {
      await handleCentralizedError(new Error(error.message), 'cleanup_enhanced_rate_limits');
      console.error('Error cleaning up enhanced rate limit records:', error);
    } else {
      console.log('Enhanced rate limit records cleaned up successfully');
    }
  } catch (error) {
    await handleCentralizedError(error as Error, 'cleanup_enhanced_rate_limits');
    console.error('Exception during enhanced rate limit cleanup:', error);
  }
};

export const cleanupOldErrorLogs = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('cleanup_old_error_logs');
    
    if (error) {
      await handleCentralizedError(new Error(error.message), 'cleanup_old_error_logs');
      console.error('Error cleaning up old error logs:', error);
    } else {
      console.log('Old error logs cleaned up successfully');
    }
  } catch (error) {
    await handleCentralizedError(error as Error, 'cleanup_old_error_logs');
    console.error('Exception during error log cleanup:', error);
  }
};

// Enhanced cleanup with comprehensive database maintenance
export const performComprehensiveCleanup = async (): Promise<void> => {
  console.log('Starting comprehensive database cleanup...');
  
  try {
    await Promise.all([
      cleanupExpiredOTP(),
      cleanupOldRateLimits(),
      cleanupEnhancedRateLimits(),
      cleanupOldErrorLogs()
    ]);
    
    console.log('Comprehensive database cleanup completed successfully');
  } catch (error) {
    await handleCentralizedError(error as Error, 'comprehensive_cleanup');
    console.error('Error during comprehensive cleanup:', error);
  }
};

// Run cleanup periodically (every 6 hours)
export const scheduleEnhancedCleanup = (): void => {
  const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  
  setInterval(async () => {
    await performComprehensiveCleanup();
  }, CLEANUP_INTERVAL);
};

// Legacy cleanup function for backward compatibility
export const scheduleCleanup = (): void => {
  scheduleEnhancedCleanup();
};
