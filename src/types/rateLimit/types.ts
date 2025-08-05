
/**
 * Rate limit types - extracted from utils/rateLimit/types.ts for cleaner imports
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
