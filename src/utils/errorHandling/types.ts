
/**
 * Core types and interfaces for the unified error handling system
 */

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface UnifiedError extends Error {
  id?: string;
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  context?: ErrorContext;
  retryable?: boolean;
  recoverable?: boolean;
  timestamp?: Date;
}

export interface ErrorLogEntry {
  error_type: string;
  error_message: string;
  error_stack?: string;
  severity: string;
  context: string;
  user_id?: string;
  session_id: string;
  metadata: Record<string, any>;
}

export interface ErrorStatistics {
  total: number;
  bySeverity: Record<string, number>;
  byComponent: Record<string, number>;
  criticalErrors: any[];
}
