
/**
 * Unified monitoring system with enhanced capabilities
 */

import { supabase } from '@/integrations/supabase/client';
import { enhancedMonitoring, trackUserAction as enhancedTrackUserAction, trackError as enhancedTrackError } from './enhancedMonitoring';

interface MonitoringMetric {
  name: string;
  value: number;
  labels?: Record<string, string | number>;
  timestamp?: Date;
}

interface TimingMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private timings = new Map<string, TimingMetric>();
  private errorCount = 0;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Timing methods
  startTiming(operation: string, metadata?: Record<string, any>): void {
    const key = `${operation}_${Date.now()}`;
    this.timings.set(key, {
      operation,
      startTime: performance.now(),
      metadata
    });
  }

  endTiming(operation: string): number | null {
    const entries = Array.from(this.timings.entries());
    const entry = entries.find(([key, timing]) => 
      timing.operation === operation && !timing.endTime
    );

    if (!entry) {
      console.warn(`No active timing found for operation: ${operation}`);
      return null;
    }

    const [key, timing] = entry;
    const endTime = performance.now();
    const duration = endTime - timing.startTime;

    timing.endTime = endTime;

    // Record the performance metric using enhanced monitoring
    enhancedMonitoring.trackPerformance(operation, duration, timing.metadata);

    return duration;
  }

  // Metric recording
  recordMetric(name: string, value: number, labels?: Record<string, string | number>): void {
    const metric = {
      metric_name: name,
      metric_value: value,
      metric_type: 'counter' as const,
      labels,
      user_id: this.getCurrentUserId()
    };

    enhancedMonitoring.recordMetric(metric);
  }

  // Error logging
  logError(error: Error, context: string, metadata?: Record<string, any>): void {
    this.errorCount++;
    
    const errorMetadata = {
      ...metadata,
      sessionId: this.sessionId,
      errorCount: this.errorCount,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      url: typeof window !== 'undefined' ? window.location.href : null
    };

    enhancedTrackError(error, context, errorMetadata);
  }

  // Warning logging method
  warn(message: string, context: string, metadata?: Record<string, any>): void {
    console.warn(`[${context}] Warning: ${message}`, metadata);
    
    // Record warning as a metric
    this.recordMetric('warning', 1, {
      context,
      message_length: message.length.toString(),
      has_metadata: metadata ? 'true' : 'false'
    });
  }

  // User action tracking
  trackUserAction(action: string, metadata?: Record<string, any>): void {
    const actionMetadata = {
      ...metadata,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };

    enhancedTrackUserAction(action, actionMetadata, this.getCurrentUserId());
  }

  // Performance monitoring
  async measureDatabaseOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let error: Error | null = null;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      
      this.recordMetric('database_operation_duration', duration, {
        operation,
        success: error ? 'false' : 'true',
        error_type: error?.name || 'none'
      });

      if (error) {
        this.logError(error, `database_${operation}`, { operation });
      }
    }
  }

  // System health monitoring
  recordSystemHealth(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, {
          page: window.location.pathname
        });

        this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, {
          page: window.location.pathname
        });
      }

      // Memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used_mb', memory.usedJSHeapSize / 1048576);
        this.recordMetric('memory_total_mb', memory.totalJSHeapSize / 1048576);
      }
    }
  }

  // Rate limiting monitoring
  recordRateLimitHit(action: string, identifier: string, blocked: boolean): void {
    this.recordMetric('rate_limit_hit', 1, {
      action,
      blocked: blocked.toString(),
      identifier_hash: this.hashIdentifier(identifier)
    });
  }

  private hashIdentifier(identifier: string): string {
    // Simple hash for privacy
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  private getCurrentUserId(): string | undefined {
    try {
      // This would be set by the auth context
      return (supabase.auth.getUser() as any)?.data?.user?.id;
    } catch {
      return undefined;
    }
  }

  // Cleanup old timings to prevent memory leaks
  cleanup(): void {
    const cutoff = Date.now() - 300000; // 5 minutes
    const toDelete: string[] = [];

    for (const [key, timing] of this.timings.entries()) {
      if (timing.startTime < cutoff) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.timings.delete(key));
  }
}

export const monitoring = new MonitoringService();

// Export convenience functions
export const trackUserAction = monitoring.trackUserAction.bind(monitoring);
export const logError = monitoring.logError.bind(monitoring);
export const recordMetric = monitoring.recordMetric.bind(monitoring);
export const startTiming = monitoring.startTiming.bind(monitoring);
export const endTiming = monitoring.endTiming.bind(monitoring);

// Set up periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    monitoring.cleanup();
  }, 300000); // Every 5 minutes

  // Record initial system health
  window.addEventListener('load', () => {
    setTimeout(() => {
      monitoring.recordSystemHealth();
    }, 1000);
  });
}
