
/**
 * Centralized error handling utilities
 */

export interface ApiError {
  code: string;
  message: string;
  details?: any;
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

export const handleSupabaseError = (error: any): ApiError => {
  console.error('Supabase error:', error);
  
  // Handle different types of Supabase errors
  if (error.code === 'PGRST301') {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Invalid data provided',
      details: error.details
    };
  }
  
  if (error.code === '23505') {
    return {
      code: 'DUPLICATE_ERROR',
      message: 'This data already exists',
      details: error.details
    };
  }
  
  if (error.code === '23503') {
    return {
      code: 'FOREIGN_KEY_ERROR',
      message: 'Referenced data does not exist',
      details: error.details
    };
  }
  
  if (error.code === '23514') {
    return {
      code: 'CHECK_CONSTRAINT_ERROR',
      message: 'Data validation failed',
      details: error.details
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred',
    details: error
  };
};

export const logError = (error: Error, context?: string) => {
  console.error(`${context ? `[${context}] ` : ''}${error.name}: ${error.message}`);
  if (error.stack) {
    console.error(error.stack);
  }
};
