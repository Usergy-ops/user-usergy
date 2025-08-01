
/**
 * Comprehensive error types for enhanced error handling
 */

// Base error types
export interface BaseError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  correlationId?: string;
}

// API Error types
export interface ApiError extends BaseError {
  status: number;
  endpoint: string;
  method: string;
  requestId?: string;
  retryable: boolean;
}

export interface ValidationError extends BaseError {
  field: string;
  value: any;
  constraints: Record<string, string>;
}

export interface AuthenticationError extends BaseError {
  reason: 'invalid_credentials' | 'token_expired' | 'account_locked' | 'account_disabled';
  attemptsRemaining?: number;
  blockUntil?: Date;
}

export interface AuthorizationError extends BaseError {
  resource: string;
  action: string;
  requiredPermissions: string[];
  currentPermissions: string[];
}

export interface RateLimitError extends BaseError {
  identifier: string;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter: number;
}

export interface DatabaseError extends BaseError {
  query?: string;
  table?: string;
  constraint?: string;
  sqlState?: string;
}

export interface NetworkError extends BaseError {
  url: string;
  timeout: boolean;
  offline: boolean;
  retryCount: number;
}

export interface BusinessLogicError extends BaseError {
  context: string;
  operation: string;
  state: Record<string, any>;
}

// Error categories
export type ErrorCategory = 
  | 'authentication'
  | 'authorization' 
  | 'validation'
  | 'api'
  | 'database'
  | 'network'
  | 'business_logic'
  | 'system'
  | 'unknown';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error handling strategies
export type ErrorHandlingStrategy = 
  | 'retry'
  | 'fallback'
  | 'ignore'
  | 'escalate'
  | 'user_action_required';

// Comprehensive error interface
export interface AppError extends BaseError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  strategy: ErrorHandlingStrategy;
  context?: {
    component?: string;
    function?: string;
    userId?: string;
    sessionId?: string;
    url?: string;
    userAgent?: string;
  };
  metadata?: Record<string, any>;
  stack?: string;
  cause?: Error;
  retryable: boolean;
  retryCount?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// Error handler configuration
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableRetry: boolean;
  enableFallback: boolean;
  enableUserNotification: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  retryConfiguration: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  fallbackConfiguration: {
    enableGracefulDegradation: boolean;
    defaultValues: Record<string, any>;
  };
}

// Error recovery actions
export interface ErrorRecoveryAction {
  id: string;
  label: string;
  description?: string;
  action: () => void | Promise<void>;
  primary?: boolean;
  destructive?: boolean;
}

// Error boundary state
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string;
  retryCount: number;
  lastError?: Date;
}

// Error reporting interface
export interface ErrorReporter {
  report(error: AppError): void | Promise<void>;
  reportBatch(errors: AppError[]): void | Promise<void>;
}

// Error transformation interface
export interface ErrorTransformer {
  transform(error: Error): AppError;
  canHandle(error: Error): boolean;
}

// Specific error classes for common scenarios
export interface OTPVerificationError extends BaseError {
  email: string;
  attemptsRemaining: number;
  blockUntil?: Date;
  reason: 'invalid_code' | 'expired' | 'too_many_attempts' | 'email_not_found';
}

export interface ProfileValidationError extends BaseError {
  field: string;
  section: string;
  requirement: string;
  currentValue: any;
}

export interface AccountTypeError extends BaseError {
  userId: string;
  currentType?: string;
  requestedType: string;
  reason: 'invalid_type' | 'permission_denied' | 'user_not_found' | 'already_assigned';
}

export interface SystemHealthError extends BaseError {
  service: string;
  healthCheck: string;
  expectedValue: any;
  actualValue: any;
  impact: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

// Error context providers
export interface ErrorContextProvider {
  getContext(): Record<string, any>;
  enrichError(error: Error): AppError;
}

// Error recovery strategies
export interface ErrorRecoveryStrategy {
  name: string;
  canRecover(error: AppError): boolean;
  recover(error: AppError): Promise<any>;
}

// Error notification types
export interface ErrorNotification {
  id: string;
  title: string;
  message: string;
  type: 'toast' | 'modal' | 'banner' | 'none';
  duration?: number;
  actions?: ErrorRecoveryAction[];
  dismissible: boolean;
  persistent: boolean;
}

// Error metrics and monitoring
export interface ErrorMetrics {
  count: number;
  rate: number;
  categories: Record<ErrorCategory, number>;
  severities: Record<ErrorSeverity, number>;
  topErrors: Array<{
    code: string;
    count: number;
    lastOccurrence: Date;
  }>;
  trends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

// Error configuration for different environments
export interface EnvironmentErrorConfig {
  development: ErrorHandlerConfig;
  staging: ErrorHandlerConfig;
  production: ErrorHandlerConfig;
}
