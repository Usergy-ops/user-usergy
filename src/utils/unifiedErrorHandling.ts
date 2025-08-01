
/**
 * Unified Error Handling System
 * Consolidates all error handling, logging, and user feedback
 */

import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { monitoring } from './monitoring';

export interface UnifiedError {
  id: string;
  type: 'validation' | 'auth' | 'network' | 'database' | 'rate_limit' | 'unknown';
  code: string;
  message: string;
  userMessage: string;
  context: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  recoverable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class UnifiedErrorHandler {
  private static instance: UnifiedErrorHandler;
  private errors: Map<string, UnifiedError> = new Map();

  static getInstance(): UnifiedErrorHandler {
    if (!UnifiedErrorHandler.instance) {
      UnifiedErrorHandler.instance = new UnifiedErrorHandler();
    }
    return UnifiedErrorHandler.instance;
  }

  // Main error handling method
  async handleError(
    error: Error | any,
    context: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<UnifiedError> {
    const unifiedError = this.createUnifiedError(error, context, userId, metadata);
    
    // Store error
    this.errors.set(unifiedError.id, unifiedError);
    
    // Log to database
    await this.logToDatabase(unifiedError);
    
    // Log to monitoring
    this.logToMonitoring(unifiedError);
    
    // Show user notification
    this.showUserNotification(unifiedError);
    
    // Trigger cleanup if needed
    await this.handleCleanup(unifiedError);
    
    return unifiedError;
  }

  // Create unified error object
  private createUnifiedError(
    error: Error | any,
    context: string,
    userId?: string,
    metadata?: Record<string, any>
  ): UnifiedError {
    const id = crypto.randomUUID();
    const timestamp = new Date();
    
    // Determine error type and severity
    const { type, severity, code } = this.categorizeError(error, context);
    
    // Generate user-friendly message
    const userMessage = this.getUserFriendlyMessage(error, type, context);
    
    return {
      id,
      type,
      code,
      message: error.message || 'Unknown error',
      userMessage,
      context,
      timestamp,
      userId,
      metadata,
      stack: error.stack,
      recoverable: this.isRecoverable(error, type),
      severity
    };
  }

  // Categorize error type and severity
  private categorizeError(error: any, context: string): { type: UnifiedError['type']; severity: UnifiedError['severity']; code: string } {
    // Authentication errors
    if (error.message?.includes('Invalid login credentials') || context.includes('auth')) {
      return { type: 'auth', severity: 'medium', code: 'AUTH_FAILED' };
    }
    
    // Validation errors
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return { type: 'validation', severity: 'low', code: 'VALIDATION_ERROR' };
    }
    
    // Rate limiting errors
    if (error.message?.includes('Too many') || context.includes('rate_limit')) {
      return { type: 'rate_limit', severity: 'medium', code: 'RATE_LIMITED' };
    }
    
    // Database errors
    if (error.code && error.code.startsWith('23')) {
      return { type: 'database', severity: 'high', code: `DB_${error.code}` };
    }
    
    // Network errors
    if (error.name === 'NetworkError' || !navigator.onLine) {
      return { type: 'network', severity: 'medium', code: 'NETWORK_ERROR' };
    }
    
    // Default to unknown
    return { type: 'unknown', severity: 'medium', code: 'UNKNOWN_ERROR' };
  }

  // Generate user-friendly messages
  private getUserFriendlyMessage(error: any, type: UnifiedError['type'], context: string): string {
    switch (type) {
      case 'auth':
        return 'Authentication failed. Please check your credentials and try again.';
      case 'validation':
        return 'Please check your input and try again.';
      case 'rate_limit':
        return 'Too many requests. Please wait a moment and try again.';
      case 'database':
        return 'A database error occurred. Please try again.';
      case 'network':
        return 'Network connection failed. Please check your connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Check if error is recoverable
  private isRecoverable(error: any, type: UnifiedError['type']): boolean {
    switch (type) {
      case 'validation':
      case 'rate_limit':
      case 'network':
        return true;
      case 'auth':
        return !error.message?.includes('blocked');
      default:
        return false;
    }
  }

  // Log to database
  private async logToDatabase(error: UnifiedError): Promise<void> {
    try {
      await supabase
        .from('error_logs')
        .insert({
          user_id: error.userId || null,
          error_type: error.type,
          error_message: error.message,
          error_stack: error.stack || null,
          context: error.context,
          metadata: {
            code: error.code,
            severity: error.severity,
            recoverable: error.recoverable,
            user_message: error.userMessage,
            ...error.metadata
          }
        });
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
  }

  // Log to monitoring system
  private logToMonitoring(error: UnifiedError): void {
    monitoring.recordMetric('unified_error_handled', 1, {
      error_type: error.type,
      error_code: error.code,
      severity: error.severity,
      context: error.context,
      recoverable: error.recoverable.toString()
    });
    
    monitoring.logError(new Error(error.message), error.context, {
      unified_error_id: error.id,
      error_type: error.type,
      severity: error.severity,
      user_id: error.userId
    });
  }

  // Show user notification
  private showUserNotification(error: UnifiedError): void {
    const variant = error.severity === 'critical' || error.severity === 'high' ? 'destructive' : 'default';
    
    toast({
      title: this.getNotificationTitle(error.type),
      description: error.userMessage,
      variant: variant as any,
      duration: error.recoverable ? 5000 : 10000
    });
  }

  // Get notification title based on error type
  private getNotificationTitle(type: UnifiedError['type']): string {
    switch (type) {
      case 'auth':
        return 'Authentication Error';
      case 'validation':
        return 'Validation Error';
      case 'rate_limit':
        return 'Rate Limit Exceeded';
      case 'database':
        return 'Database Error';
      case 'network':
        return 'Network Error';
      default:
        return 'Error';
    }
  }

  // Handle cleanup for specific error types
  private async handleCleanup(error: UnifiedError): Promise<void> {
    try {
      // Clean up failed OTP records
      if (error.context.includes('otp') && error.type === 'auth') {
        await this.cleanupFailedOTP(error.userId, error.metadata);
      }
      
      // Clean up rate limit records if needed
      if (error.type === 'rate_limit' && error.metadata?.identifier) {
        await this.cleanupRateLimitRecords(error.metadata.identifier);
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }

  // Clean up failed OTP records - using correct table name
  private async cleanupFailedOTP(userId?: string, metadata?: Record<string, any>): Promise<void> {
    if (!metadata?.email) return;
    
    try {
      // Delete expired or failed OTP records from the correct table
      await supabase
        .from('auth_otp_verifications')
        .delete()
        .eq('email', metadata.email)
        .or('expires_at.lt.now(),attempts.gte.3');
    } catch (error) {
      console.error('Failed to cleanup OTP records:', error);
    }
  }

  // Clean up rate limit records
  private async cleanupRateLimitRecords(identifier: string): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      await Promise.all([
        supabase
          .from('rate_limits')
          .delete()
          .eq('identifier', identifier)
          .lt('created_at', cutoff.toISOString()),
        supabase
          .from('enhanced_rate_limits')
          .delete()
          .eq('identifier', identifier)
          .lt('created_at', cutoff.toISOString())
      ]);
    } catch (error) {
      console.error('Failed to cleanup rate limit records:', error);
    }
  }

  // Get error by ID
  getError(id: string): UnifiedError | undefined {
    return this.errors.get(id);
  }

  // Get all errors
  getAllErrors(): UnifiedError[] {
    return Array.from(this.errors.values());
  }

  // Clear old errors
  clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [id, error] of this.errors.entries()) {
      if (error.timestamp < cutoff) {
        this.errors.delete(id);
      }
    }
  }
}

// Export singleton instance
export const unifiedErrorHandler = UnifiedErrorHandler.getInstance();

// Convenience function for handling errors
export const handleError = (
  error: Error | any,
  context: string,
  userId?: string,
  metadata?: Record<string, any>
) => unifiedErrorHandler.handleError(error, context, userId, metadata);
