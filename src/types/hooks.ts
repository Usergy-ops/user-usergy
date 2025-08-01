
/**
 * Hook types for enhanced type safety and consistency
 */

// Authentication Hook Types
export interface UseAuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  accountType: string | null;
}

export interface UseAuthActions {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string; attemptsLeft?: number }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<{ error?: string; isNewUser?: boolean; accountType?: string }>;
  resendOTP: (email: string) => Promise<{ error?: string; attemptsLeft?: number }>;
  refreshAccountType: () => Promise<void>;
}

export interface UseAuthReturn extends UseAuthState, UseAuthActions {}

// Account Type Hook Types
export interface UseAccountTypeState {
  accountType: string | null;
  isUser: boolean;
  isClient: boolean;
  isUnknown: boolean;
  loading: boolean;
}

export interface UseAccountTypeReturn extends UseAccountTypeState {
  refreshAccountType: () => Promise<void>;
}

// System Monitoring Hook Types
export interface UseSystemMonitoringState {
  stats: SystemHealthStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseSystemMonitoringActions {
  refresh: () => void;
  fixAccountTypes: () => Promise<AccountTypeFixResult>;
  syncClientWorkflow: () => Promise<ClientWorkflowSyncResult>;
  cleanupOTPRecords: () => Promise<void>;
}

export interface UseSystemMonitoringReturn extends UseSystemMonitoringState {
  actions: UseSystemMonitoringActions;
}

export interface UseSystemMonitoringOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAlerts?: boolean;
  onError?: (error: Error) => void;
  onHealthChange?: (isHealthy: boolean) => void;
}

// Async Operation Hook Types
export interface UseAsyncOperationState<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseAsyncOperationActions<T = any, P = any> {
  execute: (params?: P) => Promise<T>;
  reset: () => void;
  retry: () => Promise<T>;
}

export interface UseAsyncOperationReturn<T = any, P = any> extends UseAsyncOperationState<T>, UseAsyncOperationActions<T, P> {}

export interface UseAsyncOperationOptions<T = any, P = any> {
  immediate?: boolean;
  initialParams?: P;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
  enableRetry?: boolean;
}

// Form Hook Types
export interface UseFormState<T = Record<string, any>> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface UseFormActions<T = Record<string, any>> {
  setValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => Promise<void>;
  reset: (values?: Partial<T>) => void;
  validate: (field?: keyof T) => boolean;
}

export interface UseFormReturn<T = Record<string, any>> extends UseFormState<T>, UseFormActions<T> {}

export interface UseFormOptions<T = Record<string, any>> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  enableReinitialize?: boolean;
  onSubmit?: (values: T) => void | Promise<void>;
}

// Validation Types for Forms
export interface ValidationRule<T = any> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null | Promise<string | null>;
  dependencies?: string[];
}

export interface ValidationSchema<T = Record<string, any>> {
  [K in keyof T]?: ValidationRule<T[K]>;
}

// API Hook Types
export interface UseApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  lastFetch: Date | null;
}

export interface UseApiActions<T = any, P = any> {
  fetch: (params?: P) => Promise<T>;
  refetch: () => Promise<T>;
  mutate: (updater: (current: T | null) => T) => void;
  invalidate: () => void;
}

export interface UseApiReturn<T = any, P = any> extends UseApiState<T>, UseApiActions<T, P> {}

export interface UseApiOptions<T = any, P = any> {
  immediate?: boolean;
  params?: P;
  cacheKey?: string;
  cacheTTL?: number;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  transform?: (data: any) => T;
}

// Local Storage Hook Types
export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

export interface UseLocalStorageOptions<T> {
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  errorCallback?: (error: Error) => void;
}

// Debounce Hook Types
export interface UseDebounceOptions {
  delay?: number;
  immediate?: boolean;
  maxWait?: number;
}

export interface UseDebounceReturn<T extends (...args: any[]) => any> {
  debouncedCallback: T;
  cancel: () => void;
  flush: () => void;
  isPending: boolean;
}

// Throttle Hook Types
export interface UseThrottleOptions {
  delay?: number;
  trailing?: boolean;
  leading?: boolean;
}

export interface UseThrottleReturn<T extends (...args: any[]) => any> {
  throttledCallback: T;
  cancel: () => void;
  flush: () => void;
}

// Error Handler Hook Types
export interface UseErrorHandlerOptions {
  defaultErrorMessage?: string;
  logErrors?: boolean;
  showToast?: boolean;
  retryable?: boolean;
  onError?: (error: Error, context?: string) => void;
}

export interface UseErrorHandlerReturn {
  handleError: (error: Error | string, context?: string) => void;
  clearError: () => void;
  retry: () => void;
  currentError: Error | null;
  errorContext: string | null;
}

// Import types from api.ts and components.ts
import type {
  SystemHealthStats,
  AccountTypeFixResult,
  ClientWorkflowSyncResult
} from './api';
