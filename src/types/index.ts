
/**
 * Comprehensive type system index
 * Exports all types for easy importing throughout the application
 */

// Core API types
export * from './api';
export * from './components';
export * from './hooks';
export * from './utils';

// Error types
export type {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  DatabaseError,
  NetworkError,
  BusinessLogicError,
  AppError,
  ErrorCategory,
  ErrorSeverity,
  ErrorHandlingStrategy,
  ErrorHandlerConfig,
  ErrorRecoveryAction,
  ErrorBoundaryState,
  ErrorReporter,
  ErrorTransformer,
  OTPVerificationError,
  ProfileValidationError,
  AccountTypeError,
  SystemHealthError,
  ErrorContextProvider,
  ErrorRecoveryStrategy,
  ErrorNotification,
  ErrorMetrics,
  EnvironmentErrorConfig
} from './errors';

// Validation types
export type {
  ValidationRule,
  ValidationSchema,
  ValidationResult,
  ValidationContext,
  ValidationOptions,
  EmailValidationRule,
  PasswordValidationRule,
  PhoneValidationRule,
  DateValidationRule,
  FileValidationRule,
  ProfileValidationSchema,
  ProfileValidationResult,
  FormValidationState,
  FormValidationConfig,
  APIValidationError,
  APIValidationResponse,
  ValidationMiddleware,
  CustomValidator,
  ValidationCacheEntry,
  ValidationCache
} from './validation/types';

// Rate limiting types
export type {
  RateLimitConfig,
  RateLimitResult,
  RateLimitEntry,
  RateLimitRecord,
  RateLimitStrategy,
  RateLimitStorage,
  RateLimitManager,
  RateLimitMiddleware,
  RateLimitMetrics,
  RateLimitAlert,
  ActionRateLimitConfigs,
  AdaptiveRateLimitConfig,
  GeographicRateLimitConfig,
  UserTierRateLimitConfig,
  RateLimitEvent,
  RateLimitEventHandler,
  RateLimitCacheEntry,
  RateLimitCache
} from './rateLimit/types';

// Debug types (re-export from existing file)
export * from './debug';

// Type utility functions
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && 'status' in error && 'endpoint' in error;
};

export const isValidationError = (error: any): error is ValidationError => {
  return error && typeof error === 'object' && 'field' in error && 'constraints' in error;
};

export const isAuthenticationError = (error: any): error is AuthenticationError => {
  return error && typeof error === 'object' && 'reason' in error;
};

export const isRateLimitError = (error: any): error is RateLimitError => {
  return error && typeof error === 'object' && 'limit' in error && 'resetTime' in error;
};

// Type guards for runtime type checking
export const typeGuards = {
  isApiError,
  isValidationError,
  isAuthenticationError,
  isRateLimitError,
  
  // Additional type guards
  isString: (value: any): value is string => typeof value === 'string',
  isNumber: (value: any): value is number => typeof value === 'number' && !isNaN(value),
  isBoolean: (value: any): value is boolean => typeof value === 'boolean',
  isObject: (value: any): value is Record<string, any> => value !== null && typeof value === 'object',
  isArray: (value: any): value is any[] => Array.isArray(value),
  isFunction: (value: any): value is Function => typeof value === 'function',
  isDate: (value: any): value is Date => value instanceof Date && !isNaN(value.getTime()),
  isPromise: (value: any): value is Promise<any> => value && typeof value.then === 'function',
  
  // Account type guards
  isUserAccount: (accountType: string): boolean => accountType === 'user',
  isClientAccount: (accountType: string): boolean => accountType === 'client',
  isValidAccountType: (accountType: string): accountType is 'user' | 'client' => 
    accountType === 'user' || accountType === 'client',
    
  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // UUID validation
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
};

// Type assertion helpers
export const assertType = {
  string: (value: any, name: string = 'value'): string => {
    if (!typeGuards.isString(value)) {
      throw new Error(`Expected ${name} to be a string, got ${typeof value}`);
    }
    return value;
  },
  
  number: (value: any, name: string = 'value'): number => {
    if (!typeGuards.isNumber(value)) {
      throw new Error(`Expected ${name} to be a number, got ${typeof value}`);
    }
    return value;
  },
  
  boolean: (value: any, name: string = 'value'): boolean => {
    if (!typeGuards.isBoolean(value)) {
      throw new Error(`Expected ${name} to be a boolean, got ${typeof value}`);
    }
    return value;
  },
  
  object: (value: any, name: string = 'value'): Record<string, any> => {
    if (!typeGuards.isObject(value)) {
      throw new Error(`Expected ${name} to be an object, got ${typeof value}`);
    }
    return value;
  },
  
  array: (value: any, name: string = 'value'): any[] => {
    if (!typeGuards.isArray(value)) {
      throw new Error(`Expected ${name} to be an array, got ${typeof value}`);
    }
    return value;
  }
};

// Type conversion helpers
export const convertType = {
  toString: (value: any): string => String(value),
  toNumber: (value: any): number => {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Cannot convert ${value} to number`);
    }
    return num;
  },
  toBoolean: (value: any): boolean => Boolean(value),
  toDate: (value: any): Date => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error(`Cannot convert ${value} to Date`);
    }
    return date;
  }
};

// Environment-specific type configurations
export interface TypeSystemConfig {
  enableRuntimeTypeChecking: boolean;
  enableTypeAssertions: boolean;
  enableTypeConversions: boolean;
  logTypeErrors: boolean;
  throwOnTypeErrors: boolean;
}

export const getTypeSystemConfig = (): TypeSystemConfig => ({
  enableRuntimeTypeChecking: process.env.NODE_ENV === 'development',
  enableTypeAssertions: true,
  enableTypeConversions: true,
  logTypeErrors: process.env.NODE_ENV !== 'production',
  throwOnTypeErrors: process.env.NODE_ENV === 'development'
});
