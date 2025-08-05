/**
 * Unified error handling system that consolidates all error handling approaches
 * This module provides a single interface for error handling across the application
 */

import { supabase } from '@/integrations/supabase/client';
import { monitoring, trackUserAction } from './monitoring';

// Define a general interface for error context
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

// Define a unified error interface that extends the standard Error
export interface UnifiedError extends Error {
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  context?: ErrorContext;
  retryable?: boolean;
  timestamp?: Date;
}

class UnifiedErrorHandler {
  private static instance: UnifiedErrorHandler;
  private sessionId: string;
  private errorQueue: Array<{
    error: UnifiedError;
    context: ErrorContext;
    timestamp: Date;
  }> = [];

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorInterception();
    
    // Process error queue periodically
    setInterval(() => this.processErrorQueue(), 5000);
  }

  public static getInstance(): UnifiedErrorHandler {
    if (!UnifiedErrorHandler.instance) {
      UnifiedErrorHandler.instance = new UnifiedErrorHandler();
    }
    return UnifiedErrorHandler.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorInterception(): void {
    // Intercept unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError(new Error(event.message), {
          component: 'global_error_handler',
          action: 'unhandled_error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(event.reason), {
          component: 'global_error_handler',
          action: 'unhandled_promise_rejection'
        });
      });
    }
  }

  async handleError(error: Error | UnifiedError, context: ErrorContext = {}): Promise<void> {
    try {
      const unifiedError: UnifiedError = this.normalizeError(error, context);
      
      // Add to processing queue for batch processing
      this.errorQueue.push({
        error: unifiedError,
        context,
        timestamp: new Date()
      });

      // For critical errors, process immediately
      if (unifiedError.severity === 'critical') {
        await this.processErrorQueue();
      }

      // Log to monitoring system
      monitoring.logError(unifiedError, context.component || 'unknown', {
        ...context.metadata,
        severity: unifiedError.severity,
        retryable: unifiedError.retryable
      });

    } catch (processingError) {
      console.error('Error in unified error handler:', processingError);
      console.error('Original error:', error);
    }
  }

  private normalizeError(error: Error | UnifiedError, context: ErrorContext): UnifiedError {
    const unifiedError = error as UnifiedError;
    
    if (!unifiedError.severity) {
      unifiedError.severity = this.determineSeverity(error, context);
    }
    
    if (!unifiedError.code) {
      unifiedError.code = error.name || 'UnknownError';
    }
    
    if (!unifiedError.timestamp) {
      unifiedError.timestamp = new Date();
    }
    
    if (!unifiedError.context) {
      unifiedError.context = context;
    }
    
    if (unifiedError.retryable === undefined) {
      unifiedError.retryable = this.isRetryable(error, context);
    }
    
    return unifiedError;
  }

  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    // Authentication and security errors are critical
    if (context.action?.includes('auth') || context.action?.includes('security')) {
      return 'critical';
    }
    
    // Database errors are high severity
    if (error.message.includes('database') || error.message.includes('SQL')) {
      return 'high';
    }
    
    // Network errors are medium severity
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'medium';
    }
    
    // Validation errors are low severity
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'low';
    }
    
    return 'medium';
  }

  private isRetryable(error: Error, context: ErrorContext): boolean {
    // Network errors are usually retryable
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }
    
    // Rate limiting errors are retryable after delay
    if (error.message.includes('rate limit')) {
      return true;
    }
    
    // Authentication errors are not retryable
    if (context.action?.includes('auth')) {
      return false;
    }
    
    // Validation errors are not retryable
    if (error.message.includes('validation')) {
      return false;
    }
    
    return false;
  }

  private async processErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const batch = this.errorQueue.splice(0, 10); // Process up to 10 errors at once
    
    try {
      const errorLogs = batch.map(({ error, context, timestamp }) => ({
        error_type: error.code || error.name,
        error_message: error.message,
        error_stack: error.stack,
        severity: error.severity || 'medium',
        context: context.component || 'unknown',
        user_id: context.userId,
        session_id: context.sessionId || this.sessionId,
        metadata: {
          ...context.metadata,
          action: context.action,
          retryable: error.retryable,
          timestamp: timestamp.toISOString()
        }
      }));

      const { error: insertError } = await supabase
        .from('error_logs')
        .insert(errorLogs);

      if (insertError) {
        console.error('Failed to insert error logs:', insertError);
        // Re-add failed errors to queue for retry
        this.errorQueue.unshift(...batch);
      } else {
        // Track successful error logging
        trackUserAction('errors_logged', {
          count: batch.length,
          session_id: this.sessionId
        });
      }

    } catch (error) {
      console.error('Error processing error queue:', error);
      // Re-add failed errors to queue for retry
      this.errorQueue.unshift(...batch);
    }
  }

  // Specialized error handlers
  async handleAuthError(error: Error, userId?: string, action?: string): Promise<void> {
    await this.handleError(error, {
      userId,
      component: 'auth_system',
      action: action || 'auth_error',
      metadata: {
        auth_error: true,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      }
    });
  }

  async handleValidationError(error: Error, field: string, userId?: string): Promise<void> {
    await this.handleError(error, {
      userId,
      component: 'form_validation',
      action: 'validation_error',
      metadata: {
        field,
        validation_error: true
      }
    });
  }

  async handleNetworkError(error: Error, endpoint: string, userId?: string): Promise<void> {
    await this.handleError(error, {
      userId,
      component: 'network_client',
      action: 'network_error',
      metadata: {
        endpoint,
        network_error: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  async handleDatabaseError(error: Error, table: string, operation: string, userId?: string): Promise<void> {
    await this.handleError(error, {
      userId,
      component: 'database_client',
      action: 'database_error',
      metadata: {
        table,
        operation,
        database_error: true
      }
    });
  }

  // Cleanup old error records
  async cleanupOldErrors(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error during error log cleanup:', error);
      } else {
        console.log(`Cleaned up error logs older than ${daysToKeep} days`);
      }
    } catch (error) {
      console.error('Failed to cleanup old errors:', error);
    }
  }

  // Get error statistics
  async getErrorStatistics(hours: number = 24): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byComponent: Record<string, number>;
    criticalErrors: any[];
  }> {
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - hours);

      const { data: errors } = await supabase
        .from('error_logs')
        .select('*')
        .gte('created_at', cutoff.toISOString());

      if (!errors) {
        return {
          total: 0,
          bySeverity: {},
          byComponent: {},
          criticalErrors: []
        };
      }

      const bySeverity = errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byComponent = errors.reduce((acc, error) => {
        acc[error.context] = (acc[error.context] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const criticalErrors = errors.filter(error => error.severity === 'critical');

      return {
        total: errors.length,
        bySeverity,
        byComponent,
        criticalErrors
      };
    } catch (error) {
      console.error('Error getting error statistics:', error);
      return {
        total: 0,
        bySeverity: {},
        byComponent: {},
        criticalErrors: []
      };
    }
  }
}

// Export singleton instance and convenience functions
export const unifiedErrorHandler = UnifiedErrorHandler.getInstance();

// Convenience functions
export const handleError = unifiedErrorHandler.handleError.bind(unifiedErrorHandler);
export const handleAuthError = unifiedErrorHandler.handleAuthError.bind(unifiedErrorHandler);
export const handleValidationError = unifiedErrorHandler.handleValidationError.bind(unifiedErrorHandler);
export const handleNetworkError = unifiedErrorHandler.handleNetworkError.bind(unifiedErrorHandler);
export const handleDatabaseError = unifiedErrorHandler.handleDatabaseError.bind(unifiedErrorHandler);
export const cleanupOldErrors = unifiedErrorHandler.cleanupOldErrors.bind(unifiedErrorHandler);
export const getErrorStatistics = unifiedErrorHandler.getErrorStatistics.bind(unifiedErrorHandler);
