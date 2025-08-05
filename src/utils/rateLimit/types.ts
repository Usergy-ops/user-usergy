
/**
 * Core types for the unified rate limiting system
 */

export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes?: number;
  escalationRules?: {
    attempts: number;
    blockDurationMinutes: number;
  }[];
}

export interface RateLimitResult {
  allowed: boolean;
  attemptsRemaining: number;
  resetTime: Date;
  blocked: boolean;
  blockedUntil?: Date;
  escalationLevel?: number;
}

export interface RateLimitEntry {
  id: string;
  identifier: string;
  action: string;
  attempts: number;
  windowStart: Date;
  windowEnd?: Date;
  blockedUntil?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Add the missing RateLimitRecord type
export interface RateLimitRecord {
  id: string;
  identifier: string;
  action: string;
  attempts: number;
  windowStart: Date;
  windowEnd?: Date | null;
  blockedUntil?: Date | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
