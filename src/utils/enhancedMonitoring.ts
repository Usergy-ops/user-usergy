
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

export interface PerformanceLog {
  operation_name: string;
  duration_ms: number;
  component_name?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealthMetrics {
  avgResponseTime: number;
  errorRate: number;
  activeOperations: number;
  systemLoad: number;
}

class EnhancedMonitoring {
  private metricsBuffer: EnhancedMetric[] = [];
  private bufferSize = 10;
  private flushInterval = 5000; // 5 seconds
  private timings = new Map<string, { startTime: number; operation: string }>();

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

  async recordPerformanceLog(log: PerformanceLog) {
    try {
      const { error } = await supabase
        .from('performance_logs')
        .insert([{
          operation_name: log.operation_name,
          duration_ms: log.duration_ms,
          component_name: log.component_name,
          user_id: log.user_id,
          metadata: log.metadata || {}
        }]);

      if (error) {
        console.error('Failed to record performance log:', error);
      }
    } catch (error) {
      console.error('Performance log recording error:', error);
    }
  }

  async getSystemHealthMetrics(windowSeconds: number = 3600): Promise<SystemHealthMetrics> {
    try {
      const windowStart = new Date();
      windowStart.setSeconds(windowStart.getSeconds() - windowSeconds);

      // Get performance metrics
      const { data: performanceData } = await supabase
        .from('performance_logs')
        .select('duration_ms')
        .gte('created_at', windowStart.toISOString());

      // Get error metrics
      const { data: errorData } = await supabase
        .from('error_logs')
        .select('severity')
        .gte('created_at', windowStart.toISOString());

      // Calculate metrics
      const avgResponseTime = performanceData && performanceData.length > 0
        ? performanceData.reduce((sum, log) => sum + log.duration_ms, 0) / performanceData.length
        : 0;

      const totalOperations = performanceData?.length || 0;
      const totalErrors = errorData?.length || 0;
      const errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;

      // Simple system load calculation based on recent activity
      const systemLoad = Math.min(100, Math.max(0, 
        (totalOperations / Math.max(1, windowSeconds / 60)) * 2 + (errorRate * 50)
      ));

      return {
        avgResponseTime,
        errorRate,
        activeOperations: totalOperations,
        systemLoad
      };
    } catch (error) {
      console.error('Failed to get system health metrics:', error);
      return {
        avgResponseTime: 0,
        errorRate: 0,
        activeOperations: 0,
        systemLoad: 0
      };
    }
  }

  async triggerSystemCleanup(): Promise<any> {
    try {
      console.log('Starting comprehensive system cleanup...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Clean up old metrics
      const { error: metricsError } = await supabase
        .from('system_metrics')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      // Clean up old performance logs
      const { error: performanceError } = await supabase
        .from('performance_logs')
        .delete()
        .lt('created_at', sevenDaysAgo.toISOString());

      // Clean up resolved error logs
      const { error: errorLogsError } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .neq('severity', 'critical');

      // Clean up old rate limit records
      const { error: rateLimitError } = await supabase
        .from('enhanced_rate_limits')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      const result = {
        metrics_cleaned: !metricsError,
        performance_logs_cleaned: !performanceError,
        error_logs_cleaned: !errorLogsError,
        rate_limits_cleaned: !rateLimitError,
        cleanup_timestamp: new Date().toISOString()
      };

      console.log('System cleanup completed:', result);
      return result;
    } catch (error) {
      console.error('System cleanup failed:', error);
      throw error;
    }
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

// Timing utilities
const activeTimings = new Map<string, { startTime: number; operation: string }>();

export const startTiming = (operation: string): string => {
  const timingId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  activeTimings.set(timingId, {
    startTime: performance.now(),
    operation
  });
  return timingId;
};

export const endTiming = async (
  timingId: string, 
  operation: string, 
  context?: string, 
  userId?: string
): Promise<number> => {
  const timing = activeTimings.get(timingId);
  if (!timing) {
    console.warn(`No active timing found for ID: ${timingId}`);
    return 0;
  }

  const duration = performance.now() - timing.startTime;
  activeTimings.delete(timingId);

  // Record the performance metric
  enhancedMonitoring.trackPerformance(operation, duration, {
    context,
    user_id: userId
  });

  return duration;
};

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

// Export the methods that are being imported by other files
export const getSystemHealthMetrics = (windowSeconds?: number) => 
  enhancedMonitoring.getSystemHealthMetrics(windowSeconds);

export const triggerSystemCleanup = () => 
  enhancedMonitoring.triggerSystemCleanup();
