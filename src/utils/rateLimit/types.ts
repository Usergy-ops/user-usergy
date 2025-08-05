
export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes?: number;
  escalationRules?: Array<{
    attempts: number;
    blockDurationMinutes: number;
  }>;
}

export interface RateLimitResult {
  allowed: boolean;
  blocked: boolean;
  remaining: number;
  attemptsRemaining: number;
  resetTime: Date;
  retryAfter: number;
  blockedUntil?: Date;
  escalationLevel?: number;
}

export interface RateLimitRecord {
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
