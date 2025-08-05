
/**
 * Enhanced error handling that integrates with the updated error_logs table
 * Includes severity levels, component tracking, and session information
 */

import { supabase } from '@/integrations/supabase/client';
import { recordSystemMetric } from './enhancedMonitoring';

export interface EnhancedErrorLog {
  error_type: string;
  error_message: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  context?: string;
  component_name?: string;
  user_id?: string;
  session_id?: string;
  user_agent?: string;
  ip_address?: string;
  error_stack?: string;
  metadata?: Record<string, any>;
}

class EnhancedErrorHandler {
  private sessionId: string;

  constructor() {
    // Generate a session ID for this browser session
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  }

  async logEnhancedError(errorLog: EnhancedErrorLog): Promise<void> {
    try {
      const enhancedLog = {
        error_type: errorLog.error_type,
        error_message: errorLog.error_message,
        severity: errorLog.severity || 'error',
        context: errorLog.context,
        component_name: errorLog.component_name,
        user_id: errorLog.user_id,
        session_id: errorLog.session_id || this.sessionId,
        user_agent: errorLog.user_agent || this.getUserAgent(),
        error_stack: errorLog.error_stack,
        metadata: {
          ...errorLog.metadata,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
          user_agent_parsed: this.parseUserAgent()
        }
      };

      const { error } = await supabase
        .from('error_logs')
        .insert(enhancedLog);

      if (error) {
        console.error('Failed to log enhanced error:', error);
        // Fallback to console logging if database logging fails
        console.error('Original error details:', enhancedLog);
      } else {
        // Record error metrics for monitoring
        await recordSystemMetric({
          metric_name: 'error_logged',
          metric_value: 1,
          metric_type: 'counter',
          labels: {
            error_type: errorLog.error_type,
            severity: errorLog.severity || 'error',
            component: errorLog.component_name
          },
          user_id: errorLog.user_id
        });
      }
    } catch (loggingError) {
      console.error('Exception while logging enhanced error:', loggingError);
      console.error('Original error details:', errorLog);
    }
  }

  private parseUserAgent(): Record<string, string> {
    if (typeof navigator === 'undefined') return {};
    
    const ua = navigator.userAgent;
    const parsed: Record<string, string> = {};
    
    // Basic browser detection
    if (ua.includes('Chrome')) parsed.browser = 'Chrome';
    else if (ua.includes('Firefox')) parsed.browser = 'Firefox';
    else if (ua.includes('Safari')) parsed.browser = 'Safari';
    else if (ua.includes('Edge')) parsed.browser = 'Edge';
    
    // Basic OS detection
    if (ua.includes('Windows')) parsed.os = 'Windows';
    else if (ua.includes('Mac')) parsed.os = 'macOS';
    else if (ua.includes('Linux')) parsed.os = 'Linux';
    else if (ua.includes('Android')) parsed.os = 'Android';
    else if (ua.includes('iOS')) parsed.os = 'iOS';
    
    return parsed;
  }

  // Enhanced error handling with automatic severity detection
  async handleError(
    error: Error | string,
    context: string,
    componentName?: string,
    userId?: string,
    additionalMetadata?: Record<string, any>
  ): Promise<void> {
    const errorObj = error instanceof Error ? error : new Error(error);
    
    // Automatically determine severity based on error type and context
    let severity: 'info' | 'warning' | 'error' | 'critical' = 'error';
    
    if (context.includes('auth') || context.includes('security')) {
      severity = 'critical';
    } else if (context.includes('rate_limit') || context.includes('validation')) {
      severity = 'warning';
    } else if (errorObj.message.toLowerCase().includes('network')) {
      severity = 'warning';
    }

    await this.logEnhancedError({
      error_type: errorObj.name || 'UnknownError',
      error_message: errorObj.message,
      severity,
      context,
      component_name: componentName,
      user_id: userId,
      error_stack: errorObj.stack,
      metadata: additionalMetadata
    });
  }

  // Specialized handlers for different error types
  async handleValidationError(
    message: string,
    field: string,
    componentName: string,
    userId?: string
  ): Promise<void> {
    await this.logEnhancedError({
      error_type: 'ValidationError',
      error_message: message,
      severity: 'warning',
      context: 'form_validation',
      component_name: componentName,
      user_id: userId,
      metadata: { field, validation_failed: true }
    });
  }

  async handleNetworkError(
    error: Error,
    endpoint: string,
    method: string,
    userId?: string
  ): Promise<void> {
    await this.logEnhancedError({
      error_type: 'NetworkError',
      error_message: error.message,
      severity: 'warning',
      context: 'network_request',
      component_name: 'api_client',
      user_id: userId,
      error_stack: error.stack,
      metadata: { endpoint, method, network_error: true }
    });
  }

  async handleDatabaseError(
    error: Error,
    table: string,
    operation: string,
    userId?: string
  ): Promise<void> {
    await this.logEnhancedError({
      error_type: 'DatabaseError',
      error_message: error.message,
      severity: 'critical',
      context: 'database_operation',
      component_name: 'supabase_client',
      user_id: userId,
      error_stack: error.stack,
      metadata: { table, operation, database_error: true }
    });
  }

  async handleSecurityError(
    message: string,
    securityEvent: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEnhancedError({
      error_type: 'SecurityError',
      error_message: message,
      severity: 'critical',
      context: 'security_event',
      component_name: 'security_handler',
      user_id: userId,
      metadata: {
        ...metadata,
        security_event: securityEvent,
        requires_attention: true
      }
    });
  }

  // Get error statistics for monitoring
  async getErrorStatistics(timeWindow: number = 3600): Promise<{
    totalErrors: number;
    criticalErrors: number;
    errorsByType: Record<string, number>;
    errorsByComponent: Record<string, number>;
  }> {
    try {
      const cutoff = new Date();
      cutoff.setSeconds(cutoff.getSeconds() - timeWindow);

      const { data: errors } = await supabase
        .from('error_logs')
        .select('error_type, severity, component_name')
        .gte('created_at', cutoff.toISOString());

      if (!errors) {
        return {
          totalErrors: 0,
          criticalErrors: 0,
          errorsByType: {},
          errorsByComponent: {}
        };
      }

      const totalErrors = errors.length;
      const criticalErrors = errors.filter(e => e.severity === 'critical').length;
      
      const errorsByType = errors.reduce((acc, error) => {
        acc[error.error_type] = (acc[error.error_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorsByComponent = errors.reduce((acc, error) => {
        const component = error.component_name || 'unknown';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalErrors,
        criticalErrors,
        errorsByType,
        errorsByComponent
      };
    } catch (error) {
      console.error('Error getting error statistics:', error);
      return {
        totalErrors: 0,
        criticalErrors: 0,
        errorsByType: {},
        errorsByComponent: {}
      };
    }
  }
}

// Export singleton instance
export const enhancedErrorHandler = new EnhancedErrorHandler();

// Convenience functions
export const logEnhancedError = enhancedErrorHandler.logEnhancedError.bind(enhancedErrorHandler);
export const handleError = enhancedErrorHandler.handleError.bind(enhancedErrorHandler);
export const handleValidationError = enhancedErrorHandler.handleValidationError.bind(enhancedErrorHandler);
export const handleNetworkError = enhancedErrorHandler.handleNetworkError.bind(enhancedErrorHandler);
export const handleDatabaseError = enhancedErrorHandler.handleDatabaseError.bind(enhancedErrorHandler);
export const handleSecurityError = enhancedErrorHandler.handleSecurityError.bind(enhancedErrorHandler);
export const getErrorStatistics = enhancedErrorHandler.getErrorStatistics.bind(enhancedErrorHandler);
