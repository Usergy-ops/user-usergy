
/**
 * Utility types for enhanced type safety
 */

// Generic utility types
export type Maybe<T> = T | null | undefined;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Promise utility types
export type AsyncReturnType<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer U> ? U : T extends (...args: any) => infer U ? U : any;

// Function utility types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Configuration types
export interface BaseConfig {
  id: string;
  name: string;
  enabled: boolean;
  metadata?: Record<string, any>;
}

// Timestamp types
export interface Timestamped {
  created_at: string;
  updated_at: string;
}

// Identifiable types
export interface Identifiable {
  id: string;
}

// User context types
export interface UserContext {
  userId: string;
  email: string;
  accountType: 'user' | 'client';
  permissions: string[];
  metadata?: Record<string, any>;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Sorting types
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// Filtering types
export interface FilterParams {
  [key: string]: any;
}

// Search types
export interface SearchParams {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
}

// API request types
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// Cache types
export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  serialize?: boolean;
}

// Event types
export interface EventPayload<T = any> {
  type: string;
  data: T;
  timestamp: number;
  source?: string;
  correlationId?: string;
}

export interface EventSubscription {
  id: string;
  eventTypes: string[];
  callback: (payload: EventPayload) => void;
  active: boolean;
}

// State management types
export interface StateAction<T = any> {
  type: string;
  payload?: T;
  meta?: Record<string, any>;
}

export interface StateReducer<T> {
  (state: T, action: StateAction): T;
}

// Validation types
export interface ValidationContext {
  field: string;
  value: any;
  formData: Record<string, any>;
  errors: Record<string, string>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  sanitizedValue?: any;
}

export interface ValidatorFunction {
  (value: any, context: ValidationContext): ValidationResult | Promise<ValidationResult>;
}

// Error types
export interface ErrorInfo {
  code?: string;
  message: string;
  details?: any;
  stack?: string;
  context?: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface ErrorHandler {
  (error: ErrorInfo): void | Promise<void>;
}

// Monitoring types
export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: number;
}

export interface PerformanceMetric extends MetricData {
  duration: number;
  operation: string;
  success: boolean;
  error?: string;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: Record<string, any>;
  timestamp: number;
}

// Configuration types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'staging' | 'production';
  API_URL: string;
  DATABASE_URL: string;
  CACHE_TTL: number;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  FEATURE_FLAGS: Record<string, boolean>;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  protected?: boolean;
  requiredAccountTypes?: ('user' | 'client')[];
  title?: string;
  description?: string;
  meta?: Record<string, any>;
}

// Storage types
export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

// Serialization types
export interface SerializationAdapter<T> {
  serialize(data: T): string;
  deserialize(data: string): T;
}

// Feature flag types
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: number;
}

export interface AnalyticsTracker {
  track(event: AnalyticsEvent): void;
  identify(userId: string, properties?: Record<string, any>): void;
  page(name: string, properties?: Record<string, any>): void;
}

// A/B Testing types
export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  config?: Record<string, any>;
}

export interface Experiment {
  id: string;
  name: string;
  variants: ExperimentVariant[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetingRules?: Record<string, any>;
}

// Security types
export interface SecurityContext {
  userId?: string;
  accountType?: string;
  permissions: string[];
  roles: string[];
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RateLimitRule {
  action: string;
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes?: number;
}

// Audit types
export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
}
