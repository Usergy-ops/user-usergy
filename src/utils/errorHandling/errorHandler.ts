
/**
 * Main unified error handler class
 */

import { monitoring } from '@/utils/monitoring';
import { ErrorClassifier } from './errorClassification';
import { ErrorQueue } from './errorQueue';
import type { UnifiedError, ErrorContext, ErrorStatistics } from './types';
import { supabase } from '@/integrations/supabase/client';

export class UnifiedErrorHandler {
  private static instance: UnifiedErrorHandler;
  private sessionId: string;
  private errorQueue: ErrorQueue;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.errorQueue = new ErrorQueue(this.sessionId);
    this.setupErrorInterception();
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
        this.handleError(new Error(event.message), 'global_error_handler', undefined, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(event.reason), 'global_error_handler');
      });
    }
  }

  async handleError(
    error: Error | UnifiedError, 
    context: string = 'unknown_context', 
    userId?: string, 
    metadata?: Record<string, any>
  ): Promise<UnifiedError> {
    try {
      const errorContext: ErrorContext = {
        userId,
        component: context,
        metadata,
        sessionId: this.sessionId
      };

      const unifiedError: UnifiedError = ErrorClassifier.normalizeError(error, errorContext);
      
      // Add to processing queue for batch processing
      this.errorQueue.addError(unifiedError, errorContext);

      // Log to monitoring system
      monitoring.logError(unifiedError, context, {
        ...metadata,
        severity: unifiedError.severity,
        retryable: unifiedError.retryable
      });

      return unifiedError;

    } catch (processingError) {
      console.error('Error in unified error handler:', processingError);
      console.error('Original error:', error);
      
      // Return a basic unified error on failure
      return {
        ...error,
        id: `error_${Date.now()}`,
        severity: 'medium' as const,
        retryable: false,
        recoverable: false,
        timestamp: new Date()
      } as UnifiedError;
    }
  }

  // Specialized error handlers
  async handleAuthError(error: Error, userId?: string, action?: string): Promise<UnifiedError> {
    return await this.handleError(error, 'auth_system', userId, {
      auth_error: true,
      action: action || 'auth_error',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
  }

  async handleValidationError(error: Error, field: string, userId?: string): Promise<UnifiedError> {
    return await this.handleError(error, 'form_validation', userId, {
      field,
      validation_error: true
    });
  }

  async handleNetworkError(error: Error, endpoint: string, userId?: string): Promise<UnifiedError> {
    return await this.handleError(error, 'network_client', userId, {
      endpoint,
      network_error: true,
      timestamp: new Date().toISOString()
    });
  }

  async handleDatabaseError(error: Error, table: string, operation: string, userId?: string): Promise<UnifiedError> {
    return await this.handleError(error, 'database_client', userId, {
      table,
      operation,
      database_error: true
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
  async getErrorStatistics(hours: number = 24): Promise<ErrorStatistics> {
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
