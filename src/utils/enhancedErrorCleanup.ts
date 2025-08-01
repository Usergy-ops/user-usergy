
/**
 * Enhanced automated error cleanup utilities - aligned with secured database
 */

import { supabase } from '@/integrations/supabase/client';
import { unifiedErrorHandler } from './unifiedErrorHandling';

class EnhancedErrorCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes (more frequent)
  private readonly MAX_AGE = 12 * 60 * 60 * 1000; // 12 hours (shorter retention)

  // Start automatic cleanup with enhanced schedule
  startAutoCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.performEnhancedCleanup();
    }, this.CLEANUP_INTERVAL);

    // Run initial cleanup
    this.performEnhancedCleanup();
    
    console.log('Enhanced error cleanup service started');
  }

  // Stop automatic cleanup
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Enhanced error cleanup service stopped');
    }
  }

  // Perform comprehensive cleanup of old records
  private async performEnhancedCleanup(): Promise<void> {
    try {
      const startTime = Date.now();
      const cutoff = new Date(Date.now() - this.MAX_AGE);
      
      // Clean up error logs
      await this.cleanupErrorLogs(cutoff);
      
      // Clean up OTP verification records using the new enhanced function
      await this.cleanupOTPRecordsEnhanced();
      
      // Clean up rate limit records
      await this.cleanupRateLimitRecords(cutoff);
      
      // Clean up email send logs
      await this.cleanupEmailSendLogs(cutoff);
      
      // Clean up in-memory error records
      unifiedErrorHandler.clearOldErrors(this.MAX_AGE);
      
      const duration = Date.now() - startTime;
      console.log(`Enhanced error cleanup completed successfully in ${duration}ms`);
    } catch (error) {
      console.error('Error during enhanced cleanup:', error);
    }
  }

  // Clean up old error logs with better filtering
  private async cleanupErrorLogs(cutoff: Date): Promise<void> => {
    try {
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', cutoff.toISOString())
        .eq('resolved', true); // Only clean up resolved errors
        
      if (error) {
        console.error('Error cleaning up error logs:', error);
      } else {
        console.log('Error logs cleaned up successfully');
      }
    } catch (error) {
      console.error('Error in cleanupErrorLogs:', error);
    }
  }

  // Enhanced OTP cleanup using the database function
  private async cleanupOTPRecordsEnhanced(): Promise<void> => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_unified_otp');
        
      if (error) {
        console.error('Error cleaning up OTP records:', error);
      } else {
        console.log('OTP records cleaned up successfully');
      }
    } catch (error) {
      console.error('Error in cleanupOTPRecordsEnhanced:', error);
    }
  }

  // Enhanced rate limit cleanup
  private async cleanupRateLimitRecords(cutoff: Date): Promise<void> => {
    try {
      await Promise.all([
        // Clean up standard rate limits
        supabase
          .from('rate_limits')
          .delete()
          .lt('created_at', cutoff.toISOString())
          .or('blocked_until.is.null,blocked_until.lt.now()'),
          
        // Clean up enhanced rate limits  
        supabase
          .from('enhanced_rate_limits')
          .delete()
          .lt('created_at', cutoff.toISOString())
          .or('blocked_until.is.null,blocked_until.lt.now()')
      ]);
      
      console.log('Rate limit records cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up rate limit records:', error);
    }
  }

  // Clean up email send logs
  private async cleanupEmailSendLogs(cutoff: Date): Promise<void> => {
    try {
      const { error } = await supabase
        .from('email_send_logs')
        .delete()
        .lt('created_at', cutoff.toISOString())
        .eq('status', 'sent'); // Only clean up successfully sent emails
        
      if (error) {
        console.error('Error cleaning up email send logs:', error);
      } else {
        console.log('Email send logs cleaned up successfully');
      }
    } catch (error) {
      console.error('Error in cleanupEmailSendLogs:', error);
    }
  }

  // Manual cleanup trigger with detailed reporting
  async triggerEnhancedCleanup(): Promise<{ success: boolean; message: string; duration: number }> {
    const startTime = Date.now();
    
    try {
      await this.performEnhancedCleanup();
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: 'Enhanced cleanup completed successfully',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during cleanup',
        duration
      };
    }
  }

  // Clean up specific user's failed attempts with enhanced scope
  async cleanupUserFailedAttempts(userId: string, email: string): Promise<void> => {
    try {
      await Promise.all([
        // Clean up failed OTP attempts
        supabase
          .from('auth_otp_verifications')
          .delete()
          .eq('email', email)
          .is('verified_at', null),
          
        // Clean up rate limit records for this user
        supabase
          .from('rate_limits')
          .delete()
          .eq('identifier', email),
          
        supabase
          .from('enhanced_rate_limits')
          .delete()
          .eq('identifier', email),
          
        // Clean up error logs related to this user
        supabase
          .from('error_logs')
          .delete()
          .eq('user_id', userId)
          .in('error_type', ['auth_error', 'otp_error', 'rate_limit_error'])
      ]);
      
      console.log(`Cleaned up failed attempts for user: ${email}`);
    } catch (error) {
      console.error('Error cleaning up user failed attempts:', error);
    }
  }

  // Get cleanup statistics
  async getCleanupStats(): Promise<{
    error_logs_count: number;
    otp_records_count: number;
    rate_limits_count: number;
    email_logs_count: number;
  }> {
    try {
      const [errorLogs, otpRecords, rateLimits, emailLogs] = await Promise.all([
        supabase.from('error_logs').select('id', { count: 'exact', head: true }),
        supabase.from('auth_otp_verifications').select('id', { count: 'exact', head: true }),
        supabase.from('rate_limits').select('id', { count: 'exact', head: true }),
        supabase.from('email_send_logs').select('id', { count: 'exact', head: true })
      ]);
      
      return {
        error_logs_count: errorLogs.count || 0,
        otp_records_count: otpRecords.count || 0,
        rate_limits_count: rateLimits.count || 0,
        email_logs_count: emailLogs.count || 0
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return {
        error_logs_count: 0,
        otp_records_count: 0,
        rate_limits_count: 0,
        email_logs_count: 0
      };
    }
  }
}

// Export enhanced singleton instance
export const enhancedErrorCleanupService = new EnhancedErrorCleanupService();

// Auto-start enhanced cleanup when module loads
enhancedErrorCleanupService.startAutoCleanup();
