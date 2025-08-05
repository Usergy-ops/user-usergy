
/**
 * Centralized monitoring and telemetry system
 */

import { supabase } from '@/integrations/supabase/client';

interface MetricData {
  [key: string]: string | number | boolean;
}

interface TimingData {
  [key: string]: number;
}

class MonitoringService {
  private timings: TimingData = {};
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startTiming(operation: string): void {
    this.timings[operation] = Date.now();
  }

  endTiming(operation: string): number {
    const startTime = this.timings[operation];
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }
    
    const duration = Date.now() - startTime;
    delete this.timings[operation];
    
    // Log to database
    this.logPerformance(operation, duration);
    
    return duration;
  }

  recordMetric(name: string, value: number, labels?: MetricData): void {
    this.logMetric(name, value, 'counter', labels);
  }

  recordGauge(name: string, value: number, labels?: MetricData): void {
    this.logMetric(name, value, 'gauge', labels);
  }

  recordHistogram(name: string, value: number, labels?: MetricData): void {
    this.logMetric(name, value, 'histogram', labels);
  }

  private async logMetric(name: string, value: number, type: string, labels?: MetricData): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_metrics')
        .insert({
          metric_name: name,
          metric_value: value,
          metric_type: type,
          labels: labels || {},
          user_id: await this.getCurrentUserId(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log metric:', error);
      }
    } catch (error) {
      console.error('Error logging metric:', error);
    }
  }

  private async logPerformance(operation: string, duration: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_logs')
        .insert({
          operation_name: operation,
          duration_ms: duration,
          user_id: await this.getCurrentUserId(),
          session_id: this.sessionId,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log performance:', error);
      }
    } catch (error) {
      console.error('Error logging performance:', error);
    }
  }

  async logError(error: Error, context: string, metadata?: MetricData): Promise<void> {
    try {
      console.error(`[${context}] Error:`, error);
      
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert({
          error_type: error.name || 'Error',
          error_message: error.message,
          error_stack: error.stack,
          context,
          severity: this.getSeverity(error),
          metadata: metadata || {},
          user_id: await this.getCurrentUserId(),
          session_id: this.sessionId,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          created_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('Failed to log error to database:', dbError);
      }
    } catch (logError) {
      console.error('Error logging error:', logError);
    }
  }

  private getSeverity(error: Error): string {
    if (error.message?.includes('Network') || error.message?.includes('fetch')) {
      return 'warning';
    }
    if (error.message?.includes('Authentication') || error.message?.includes('Unauthorized')) {
      return 'high';
    }
    if (error.message?.includes('Database') || error.message?.includes('SQL')) {
      return 'critical';
    }
    return 'medium';
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      return null;
    }
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// Convenience function for user action tracking
export const trackUserAction = (action: string, properties?: MetricData): void => {
  monitoring.recordMetric('user_action', 1, {
    action,
    ...properties,
    timestamp: new Date().toISOString()
  });
  
  console.log(`[User Action] ${action}:`, properties);
};
