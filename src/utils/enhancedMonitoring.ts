
/**
 * Enhanced monitoring with progressive rate limiting support
 */

import { supabase } from '@/integrations/supabase/client';

export interface EnhancedMetric {
  metric_name: string;
  metric_value: number;
  metric_type: 'counter' | 'gauge' | 'histogram';
  labels?: Record<string, string | number>;
  user_id?: string;
}

export interface DatabaseError {
  operation: string;
  table: string;
  error: Error;
  context?: Record<string, any>;
}

class EnhancedMonitoring {
  private metricsBuffer: EnhancedMetric[] = [];
  private bufferSize = 10;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    this.startMetricsBufferFlush();
  }

  private startMetricsBufferFlush() {
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushMetrics();
      }
    }, this.flushInterval);
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const { error } = await supabase
        .from('system_metrics')
        .insert(metrics);

      if (error) {
        console.error('Failed to flush metrics:', error);
        // Return metrics to buffer for retry
        this.metricsBuffer.unshift(...metrics.slice(0, this.bufferSize));
      }
    } catch (error) {
      console.error('Metrics flush error:', error);
    }
  }

  recordMetric(metric: EnhancedMetric) {
    this.metricsBuffer.push(metric);
    
    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flushMetrics();
    }
  }

  trackUserAction(action: string, metadata?: Record<string, any>, userId?: string) {
    this.recordMetric({
      metric_name: 'user_action',
      metric_value: 1,
      metric_type: 'counter',
      labels: {
        action,
        ...metadata
      },
      user_id: userId
    });
  }

  trackPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric({
      metric_name: 'performance',
      metric_value: duration,
      metric_type: 'histogram',
      labels: {
        operation,
        ...metadata
      }
    });
  }

  trackError(error: Error, context: string, metadata?: Record<string, any>) {
    console.error(`[${context}] Error:`, error);
    
    this.recordMetric({
      metric_name: 'error',
      metric_value: 1,
      metric_type: 'counter',
      labels: {
        error_type: error.name,
        context,
        ...metadata
      }
    });

    // Also log to error_logs table for detailed tracking
    this.logDetailedError(error, context, metadata);
  }

  private async logDetailedError(error: Error, context: string, metadata?: Record<string, any>) {
    try {
      await supabase.from('error_logs').insert({
        error_type: error.name,
        error_message: error.message,
        error_stack: error.stack,
        context,
        metadata: metadata || {},
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        component_name: metadata?.component,
        session_id: metadata?.sessionId
      });
    } catch (logError) {
      console.error('Failed to log detailed error:', logError);
    }
  }
}

// Database error handling with retry logic
export const handleDatabaseError = async (
  error: Error, 
  table: string, 
  operation: string, 
  identifier?: string
): Promise<void> => {
  const context = {
    table,
    operation,
    identifier,
    error_code: (error as any).code,
    error_details: (error as any).details
  };

  enhancedMonitoring.trackError(error, `database_${operation}`, context);
  
  // Log specific database errors for analysis
  try {
    await supabase.from('error_logs').insert({
      error_type: 'database_error',
      error_message: error.message,
      error_stack: error.stack,
      context: `${table}_${operation}`,
      metadata: context,
      severity: 'error'
    });
  } catch (logError) {
    console.error('Failed to log database error:', logError);
  }
};

// System metric recording helper
export const recordSystemMetric = async (metric: EnhancedMetric): Promise<void> => {
  try {
    const { error } = await supabase
      .from('system_metrics')
      .insert([metric]);

    if (error) {
      console.error('Failed to record system metric:', error);
    }
  } catch (error) {
    console.error('System metric recording error:', error);
  }
};

export const enhancedMonitoring = new EnhancedMonitoring();

// Convenience functions
export const trackUserAction = (action: string, metadata?: Record<string, any>, userId?: string) => {
  enhancedMonitoring.trackUserAction(action, metadata, userId);
};

export const trackPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => {
  enhancedMonitoring.trackPerformance(operation, duration, metadata);
};

export const trackError = (error: Error, context: string, metadata?: Record<string, any>) => {
  enhancedMonitoring.trackError(error, context, metadata);
};
