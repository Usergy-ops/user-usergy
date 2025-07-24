
/**
 * Centralized error handling system with logging to database
 */

import { supabase } from '@/integrations/supabase/client';
import { monitoring } from './monitoring';

export interface ErrorLogEntry {
  user_id?: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  context?: string;
  metadata?: Record<string, any>;
}

export class CentralizedError extends Error {
  public readonly errorType: string;
  public readonly context?: string;
  public readonly metadata?: Record<string, any>;
  public readonly userId?: string;

  constructor(
    message: string,
    errorType: string,
    context?: string,
    metadata?: Record<string, any>,
    userId?: string
  ) {
    super(message);
    this.name = 'CentralizedError';
    this.errorType = errorType;
    this.context = context;
    this.metadata = metadata;
    this.userId = userId;
  }
}

export const logErrorToDatabase = async (errorEntry: ErrorLogEntry): Promise<void> => {
  try {
    const { error } = await supabase
      .from('error_logs')
      .insert({
        user_id: errorEntry.user_id || null,
        error_type: errorEntry.error_type,
        error_message: errorEntry.error_message,
        error_stack: errorEntry.error_stack || null,
        context: errorEntry.context || null,
        metadata: errorEntry.metadata || {}
      });

    if (error) {
      // If database logging fails, fall back to console logging
      console.error('Failed to log error to database:', error);
      console.error('Original error:', errorEntry);
    }
  } catch (fallbackError) {
    console.error('Critical error in error logging system:', fallbackError);
    console.error('Original error:', errorEntry);
  }
};

export const handleCentralizedError = async (
  error: Error | CentralizedError,
  context?: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    // Extract error information
    const errorType = error instanceof CentralizedError ? error.errorType : error.constructor.name;
    const errorContext = error instanceof CentralizedError ? error.context : context;
    const errorMetadata = error instanceof CentralizedError ? error.metadata : metadata;
    const errorUserId = error instanceof CentralizedError ? error.userId : userId;

    // Log to database
    await logErrorToDatabase({
      user_id: errorUserId,
      error_type: errorType,
      error_message: error.message,
      error_stack: error.stack,
      context: errorContext,
      metadata: errorMetadata
    });

    // Log to monitoring system
    monitoring.logError(error, errorContext || 'unknown_context', {
      error_type: errorType,
      user_id: errorUserId,
      ...errorMetadata
    });

  } catch (handlingError) {
    console.error('Error in centralized error handler:', handlingError);
    console.error('Original error:', error);
  }
};

// Error classification helpers
export const createValidationError = (message: string, field?: string, userId?: string): CentralizedError => {
  return new CentralizedError(
    message,
    'ValidationError',
    'form_validation',
    { field },
    userId
  );
};

export const createAuthenticationError = (message: string, userId?: string): CentralizedError => {
  return new CentralizedError(
    message,
    'AuthenticationError',
    'user_auth',
    {},
    userId
  );
};

export const createDatabaseError = (message: string, operation: string, userId?: string): CentralizedError => {
  return new CentralizedError(
    message,
    'DatabaseError',
    'database_operation',
    { operation },
    userId
  );
};

export const createRateLimitError = (message: string, action: string, userId?: string): CentralizedError => {
  return new CentralizedError(
    message,
    'RateLimitError',
    'rate_limiting',
    { action },
    userId
  );
};

// Error boundary helper
export const withErrorBoundary = async <T>(
  operation: () => Promise<T>,
  context: string,
  userId?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    await handleCentralizedError(error as Error, context, userId);
    throw error;
  }
};
