
/**
 * Enhanced monitoring system that integrates with the new database tables
 * Created to work with the comprehensive backend migration
 */

import { supabase } from '@/integrations/supabase/client';
import { handleCentralizedError } from './centralizedErrorHandling';

export interface SystemMetric {
  metric_name: string;
  metric_value: number;
  metric_type: 'counter' | 'gauge' | 'histogram';
  labels?: Record<string, any>;
  user_id?: string;
}

export interface PerformanceLog {
  operation_name: string;
  duration_ms: number;
  component_name?: string;
  user_id?: string;
  session_id?: string;
  metadata?: Record<string, any>;
}

class EnhancedMonitoringService {
  private performanceTimers: Map<string, number> = new Map();

  // Record system metrics in the new system_metrics table
  async recordSystemMetric(metric: SystemMetric): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_metrics')
        .insert({
          metric_name: metric.metric_name,
          metric_value: metric.metric_value,
          metric_type: metric.metric_type,
          labels: metric.labels || {},
          user_id: metric.user_id
        });

      if (error) {
        console.error('Error recording system metric:', error);
        await handleCentralizedError(
          new Error(`Failed to record metric: ${error.message}`),
          'enhanced_monitoring_metric',
          metric.user_id
        );
      }
    } catch (error) {
      console.error('Exception recording system metric:', error);
      await handleCentralizedError(
        error as Error,
        'enhanced_monitoring_metric_exception',
        metric.user_id
      );
    }
  }

  // Record performance logs in the new performance_logs table
  async recordPerformanceLog(perfLog: PerformanceLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_logs')
        .insert({
          operation_name: perfLog.operation_name,
          duration_ms: perfLog.duration_ms,
          component_name: perfLog.component_name,
          user_id: perfLog.user_id,
          session_id: perfLog.session_id,
          metadata: perfLog.metadata || {}
        });

      if (error) {
        console.error('Error recording performance log:', error);
        await handleCentralizedError(
          new Error(`Failed to record performance log: ${error.message}`),
          'enhanced_monitoring_performance',
          perfLog.user_id
        );
      }
    } catch (error) {
      console.error('Exception recording performance log:', error);
      await handleCentralizedError(
        error as Error,
        'enhanced_monitoring_performance_exception',
        perfLog.user_id
      );
    }
  }

  // Enhanced timer functions with automatic logging
  startTiming(operationName: string): string {
    const timerId = `${operationName}_${Date.now()}_${Math.random()}`;
    this.performanceTimers.set(timerId, performance.now());
    return timerId;
  }

  async endTiming(
    timerId: string, 
    operationName: string, 
    componentName?: string, 
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<number> {
    const startTime = this.performanceTimers.get(timerId);
    if (!startTime) {
      console.warn(`Timer ${timerId} not found`);
      return 0;
    }

    const duration = Math.round(performance.now() - startTime);
    this.performanceTimers.delete(timerId);

    // Record performance log
    await this.recordPerformanceLog({
      operation_name: operationName,
      duration_ms: duration,
      component_name: componentName,
      user_id: userId,
      metadata
    });

    // Also record as a metric for analytics
    await this.recordSystemMetric({
      metric_name: `${operationName}_duration`,
      metric_value: duration,
      metric_type: 'histogram',
      labels: {
        component: componentName,
        operation: operationName
      },
      user_id: userId
    });

    return duration;
  }

  // Handle database errors with proper logging
  async handleDatabaseError(
    error: Error,
    table: string,
    operation: string,
    userId?: string
  ): Promise<void> {
    console.error(`Database error in ${table}.${operation}:`, error);
    
    await handleCentralizedError(
      error,
      `database_error_${table}_${operation}`,
      userId
    );

    await this.recordSystemMetric({
      metric_name: 'database_error',
      metric_value: 1,
      metric_type: 'counter',
      labels: {
        table,
        operation,
        error_type: error.name
      },
      user_id: userId
    });
  }

  // Get system health metrics from the database
  async getSystemHealthMetrics(timeWindow: number = 3600): Promise<{
    avgResponseTime: number;
    errorRate: number;
    activeOperations: number;
    systemLoad: number;
  }> {
    try {
      const cutoff = new Date();
      cutoff.setSeconds(cutoff.getSeconds() - timeWindow);

      // Get average response time from performance logs
      const { data: perfData } = await supabase
        .from('performance_logs')
        .select('duration_ms')
        .gte('created_at', cutoff.toISOString());

      const avgResponseTime = perfData && perfData.length > 0
        ? perfData.reduce((sum, log) => sum + log.duration_ms, 0) / perfData.length
        : 0;

      // Get error rate from error logs
      const { count: totalOps } = await supabase
        .from('performance_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', cutoff.toISOString());

      const { count: errorCount } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', cutoff.toISOString())
        .neq('severity', 'info');

      const errorRate = totalOps && totalOps > 0 ? (errorCount || 0) / totalOps : 0;

      // Get active operations count
      const { count: activeOperations } = await supabase
        .from('system_metrics')
        .select('*', { count: 'exact' })
        .eq('metric_type', 'counter')
        .gte('created_at', cutoff.toISOString());

      return {
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        activeOperations: activeOperations || 0,
        systemLoad: Math.min(100, Math.round((avgResponseTime / 1000) * 10))
      };

    } catch (error) {
      console.error('Error getting system health metrics:', error);
      await handleCentralizedError(
        error as Error,
        'enhanced_monitoring_health_metrics'
      );
      
      return {
        avgResponseTime: 0,
        errorRate: 0,
        activeOperations: 0,
        systemLoad: 0
      };
    }
  }

  // Trigger comprehensive system cleanup
  async triggerSystemCleanup(): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('comprehensive_system_cleanup');

      if (error) {
        throw new Error(`Cleanup failed: ${error.message}`);
      }

      await this.recordSystemMetric({
        metric_name: 'system_cleanup_triggered',
        metric_value: 1,
        metric_type: 'counter',
        labels: { manual: true }
      });

      return data;
    } catch (error) {
      console.error('Error triggering system cleanup:', error);
      await handleCentralizedError(
        error as Error,
        'enhanced_monitoring_cleanup_trigger'
      );
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedMonitoring = new EnhancedMonitoringService();

// Convenience functions
export const recordSystemMetric = enhancedMonitoring.recordSystemMetric.bind(enhancedMonitoring);
export const recordPerformanceLog = enhancedMonitoring.recordPerformanceLog.bind(enhancedMonitoring);
export const startTiming = enhancedMonitoring.startTiming.bind(enhancedMonitoring);
export const endTiming = enhancedMonitoring.endTiming.bind(enhancedMonitoring);
export const getSystemHealthMetrics = enhancedMonitoring.getSystemHealthMetrics.bind(enhancedMonitoring);
export const triggerSystemCleanup = enhancedMonitoring.triggerSystemCleanup.bind(enhancedMonitoring);
export const handleDatabaseError = enhancedMonitoring.handleDatabaseError.bind(enhancedMonitoring);
