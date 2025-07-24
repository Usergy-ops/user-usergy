
/**
 * Automated error cleanup utilities
 */

import { supabase } from '@/integrations/supabase/client';
import { unifiedErrorHandler } from './unifiedErrorHandling';

class ErrorCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  // Start automatic cleanup
  startAutoCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);

    // Run initial cleanup
    this.performCleanup();
  }

  // Stop automatic cleanup
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Perform cleanup of old records
  private async performCleanup(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - this.MAX_AGE);
      
      // Clean up error logs
      await this.cleanupErrorLogs(cutoff);
      
      // Clean up OTP verification records
      await this.cleanupOTPRecords(cutoff);
      
      // Clean up rate limit records
      await this.cleanupRateLimitRecords(cutoff);
      
      // Clean up in-memory error records
      unifiedErrorHandler.clearOldErrors(this.MAX_AGE);
      
      console.log('Error cleanup completed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Clean up old error logs
  private async cleanupErrorLogs(cutoff: Date): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', cutoff.toISOString());
        
      if (error) {
        console.error('Error cleaning up error logs:', error);
      }
    } catch (error) {
      console.error('Error in cleanupErrorLogs:', error);
    }
  }

  // Clean up expired OTP records
  private async cleanupOTPRecords(cutoff: Date): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_otp_verification')
        .delete()
        .or(`expires_at.lt.${new Date().toISOString()},created_at.lt.${cutoff.toISOString()}`);
        
      if (error) {
        console.error('Error cleaning up OTP records:', error);
      }
    } catch (error) {
      console.error('Error in cleanupOTPRecords:', error);
    }
  }

  // Clean up old rate limit records
  private async cleanupRateLimitRecords(cutoff: Date): Promise<void> {
    try {
      await Promise.all([
        supabase
          .from('rate_limits')
          .delete()
          .lt('created_at', cutoff.toISOString()),
        supabase
          .from('enhanced_rate_limits')
          .delete()
          .lt('created_at', cutoff.toISOString())
      ]);
    } catch (error) {
      console.error('Error cleaning up rate limit records:', error);
    }
  }

  // Manual cleanup trigger
  async triggerCleanup(): Promise<void> {
    await this.performCleanup();
  }

  // Clean up specific user's failed attempts
  async cleanupUserFailedAttempts(userId: string, email: string): Promise<void> {
    try {
      // Clean up failed OTP attempts
      await supabase
        .from('user_otp_verification')
        .delete()
        .eq('email', email)
        .neq('verified_at', null);
        
      // Clean up rate limit records for this user
      await Promise.all([
        supabase
          .from('rate_limits')
          .delete()
          .eq('identifier', email),
        supabase
          .from('enhanced_rate_limits')
          .delete()
          .eq('identifier', email)
      ]);
    } catch (error) {
      console.error('Error cleaning up user failed attempts:', error);
    }
  }
}

// Export singleton instance
export const errorCleanupService = new ErrorCleanupService();

// Auto-start cleanup when module loads
errorCleanupService.startAutoCleanup();
