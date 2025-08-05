
export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  blocked: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter: number;
}

export interface RateLimitRecord {
  id: string;
  identifier: string;
  action: string;
  attempts: number;
  windowStart: Date;
  blockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}
