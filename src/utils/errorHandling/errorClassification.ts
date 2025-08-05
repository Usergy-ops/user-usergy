
/**
 * Error classification and severity determination
 */

import type { ErrorContext, UnifiedError } from './types';

export class ErrorClassifier {
  static determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
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

  static isRetryable(error: Error, context: ErrorContext): boolean {
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

  static isRecoverable(error: Error, context: ErrorContext): boolean {
    // Network errors are usually recoverable
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }
    
    // Some validation errors can be recovered from
    if (error.message.includes('validation')) {
      return true;
    }
    
    // Critical system errors are not recoverable
    if (context.component === 'global_error_handler') {
      return false;
    }
    
    return true;
  }

  static normalizeError(error: Error | UnifiedError, context: ErrorContext): UnifiedError {
    const unifiedError = error as UnifiedError;
    
    if (!unifiedError.id) {
      unifiedError.id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
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

    if (unifiedError.recoverable === undefined) {
      unifiedError.recoverable = this.isRecoverable(error, context);
    }
    
    return unifiedError;
  }
}
