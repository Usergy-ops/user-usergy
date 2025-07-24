
/**
 * Enhanced centralized error handling utilities with monitoring
 */

import { monitoring } from './monitoring';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: Date;
  context?: string;
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public resetTime?: Date) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export const handleSupabaseError = (error: any, context?: string): ApiError => {
  const timestamp = new Date();
  
  // Log error with monitoring
  monitoring.logError(error, 'supabase_error', {
    context,
    error_code: error.code,
    error_details: error.details
  });
  
  // Handle different types of Supabase errors
  if (error.code === 'PGRST301') {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Invalid data provided',
      details: error.details,
      timestamp,
      context
    };
  }
  
  if (error.code === '23505') {
    return {
      code: 'DUPLICATE_ERROR',
      message: 'This data already exists',
      details: error.details,
      timestamp,
      context
    };
  }
  
  if (error.code === '23503') {
    return {
      code: 'FOREIGN_KEY_ERROR',
      message: 'Referenced data does not exist',
      details: error.details,
      timestamp,
      context
    };
  }
  
  if (error.code === '23514') {
    return {
      code: 'CHECK_CONSTRAINT_ERROR',
      message: 'Data validation failed',
      details: error.details,
      timestamp,
      context
    };
  }

  // Handle authentication errors
  if (error.message?.includes('Invalid login credentials')) {
    return {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      details: error.details,
      timestamp,
      context
    };
  }

  if (error.message?.includes('Email not confirmed')) {
    return {
      code: 'AUTH_EMAIL_NOT_CONFIRMED',
      message: 'Please verify your email address',
      details: error.details,
      timestamp,
      context
    };
  }

  // Handle rate limiting errors
  if (error.message?.includes('Too many')) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      details: error.details,
      timestamp,
      context
    };
  }

  // Handle network errors
  if (error.name === 'NetworkError') {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
      details: error.details,
      timestamp,
      context
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred',
    details: error,
    timestamp,
    context
  };
};

export const logError = (error: Error, context?: string, additionalData?: any) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date(),
    ...additionalData
  };

  // Log to monitoring system
  monitoring.logError(error, context || 'unknown_context', additionalData);
  
  // Log to console for development
  if (process.env.NODE_ENV === 'development') {
    console.error(`${context ? `[${context}] ` : ''}${error.name}: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    if (additionalData) {
      console.error('Additional data:', additionalData);
    }
  }
};

// Enhanced error handler with retry logic
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: string
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      logError(lastError, context, {
        attempt,
        maxRetries,
        willRetry: attempt < maxRetries
      });
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError!;
};

// Error boundary handler for React components
export const handleComponentError = (error: Error, errorInfo: any, componentName: string) => {
  logError(error, `component_error_${componentName}`, {
    componentStack: errorInfo.componentStack,
    errorBoundary: true
  });
};

// Global error handler
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(new Error(event.reason), 'unhandled_promise_rejection', {
      reason: event.reason,
      promise: event.promise
    });
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logError(event.error, 'uncaught_error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
};

// User-friendly error messages
export const getUserFriendlyMessage = (error: ApiError): string => {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    case 'DUPLICATE_ERROR':
      return 'This item already exists. Please use a different value.';
    case 'FOREIGN_KEY_ERROR':
      return 'Referenced item not found. Please refresh and try again.';
    case 'AUTH_INVALID_CREDENTIALS':
      return 'Invalid email or password. Please check your credentials.';
    case 'AUTH_EMAIL_NOT_CONFIRMED':
      return 'Please verify your email address before signing in.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many requests. Please wait a moment and try again.';
    case 'NETWORK_ERROR':
      return 'Connection failed. Please check your internet connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
};
