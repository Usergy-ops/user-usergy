
/**
 * Enhanced rate limiting types with complete coverage
 */

export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes?: number;
  escalationRules?: {
    attempts: number;
    blockDurationMinutes: number;
  }[];
  customMessage?: string;
  exemptUsers?: string[];
  exemptIPs?: string[];
}

export interface RateLimitResult {
  allowed: boolean;
  attemptsRemaining: number;
  resetTime: Date;
  blocked: boolean;
  blockedUntil?: Date;
  escalationLevel?: number;
  message?: string;
  retryAfter?: number;
  metadata?: {
    windowStart: Date;
    windowEnd: Date;
    totalAttempts: number;
    identifier: string;
    action: string;
  };
}

export interface RateLimitEntry {
  id: string;
  identifier: string;
  action: string;
  attempts: number;
  windowStart: Date;
  windowEnd?: Date;
  blockedUntil?: Date;
  escalationLevel?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitRecord {
  id: string;
  identifier: string;
  action: string;
  attempts: number;
  windowStart: Date;
  windowEnd?: Date | null;
  blockedUntil?: Date | null;
  escalationLevel?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced rate limiting interfaces
export interface RateLimitStrategy {
  name: string;
  calculate: (config: RateLimitConfig, current: RateLimitEntry) => RateLimitResult;
  shouldBlock: (result: RateLimitResult) => boolean;
  getBlockDuration: (result: RateLimitResult, config: RateLimitConfig) => number;
}

export interface RateLimitStorage {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  increment(key: string, action: string): Promise<RateLimitEntry>;
  cleanup(): Promise<void>;
  getAll(identifier?: string): Promise<RateLimitEntry[]>;
}

export interface RateLimitManager {
  check(identifier: string, action: string, config?: RateLimitConfig): Promise<RateLimitResult>;
  reset(identifier: string, action?: string): Promise<void>;
  block(identifier: string, action: string, duration: number): Promise<void>;
  unblock(identifier: string, action?: string): Promise<void>;
  getStatus(identifier: string, action?: string): Promise<RateLimitEntry[]>;
  configure(action: string, config: RateLimitConfig): void;
}

// Rate limiting middleware types
export interface RateLimitMiddleware {
  name: string;
  priority: number;
  shouldApply: (identifier: string, action: string) => boolean;
  beforeCheck?: (identifier: string, action: string) => Promise<void>;
  afterCheck?: (identifier: string, action: string, result: RateLimitResult) => Promise<void>;
  onBlock?: (identifier: string, action: string, result: RateLimitResult) => Promise<void>;
  onUnblock?: (identifier: string, action: string) => Promise<void>;
}

// Rate limiting metrics and monitoring
export interface RateLimitMetrics {
  totalChecks: number;
  totalBlocks: number;
  totalAllowed: number;
  blockRate: number;
  allowRate: number;
  topBlockedIdentifiers: Array<{
    identifier: string;
    blocks: number;
    lastBlock: Date;
  }>;
  topBlockedActions: Array<{
    action: string;
    blocks: number;
    lastBlock: Date;
  }>;
  averageAttempts: number;
  peakUsage: {
    timestamp: Date;
    checks: number;
  };
}

export interface RateLimitAlert {
  id: string;
  type: 'threshold_exceeded' | 'unusual_pattern' | 'abuse_detected';
  identifier: string;
  action: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Configuration types for different actions
export interface ActionRateLimitConfigs {
  auth: {
    signin: RateLimitConfig;
    signup: RateLimitConfig;
    otp_verification: RateLimitConfig;
    otp_resend: RateLimitConfig;
    password_reset: RateLimitConfig;
  };
  api: {
    profile_update: RateLimitConfig;
    file_upload: RateLimitConfig;
    search: RateLimitConfig;
    export: RateLimitConfig;
  };
  admin: {
    user_management: RateLimitConfig;
    system_monitoring: RateLimitConfig;
    bulk_operations: RateLimitConfig;
  };
}

// Advanced rate limiting types
export interface AdaptiveRateLimitConfig extends RateLimitConfig {
  adaptiveScaling: {
    enabled: boolean;
    scaleFactor: number;
    minAttempts: number;
    maxAttempts: number;
    scaleBasedOn: 'success_rate' | 'error_rate' | 'load' | 'custom';
  };
}

export interface GeographicRateLimitConfig extends RateLimitConfig {
  geographic: {
    enabled: boolean;
    allowedCountries?: string[];
    blockedCountries?: string[];
    regionLimits?: Record<string, RateLimitConfig>;
  };
}

export interface UserTierRateLimitConfig extends RateLimitConfig {
  userTiers: {
    enabled: boolean;
    tiers: Record<string, RateLimitConfig>;
    defaultTier: string;
    getTierForUser: (userId: string) => Promise<string>;
  };
}

// Rate limiting events
export interface RateLimitEvent {
  type: 'check' | 'block' | 'unblock' | 'reset' | 'cleanup';
  identifier: string;
  action: string;
  result?: RateLimitResult;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface RateLimitEventHandler {
  onEvent(event: RateLimitEvent): void | Promise<void>;
  eventTypes: string[];
  priority: number;
}

// Rate limiting cache types
export interface RateLimitCacheEntry {
  key: string;
  data: RateLimitEntry;
  expiresAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

export interface RateLimitCache {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
  stats(): Promise<{
    hitRate: number;
    missRate: number;
    totalHits: number;
    totalMisses: number;
    entryCount: number;
  }>;
}
