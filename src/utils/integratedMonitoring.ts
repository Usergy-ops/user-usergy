/**
 * Integrated monitoring system that combines rate limiting, error handling,
 * and performance monitoring with centralized alerting
 */

import { monitoring } from './monitoring';
import { handleCentralizedError } from './centralizedErrorHandling';
import { checkRateLimit, checkEnhancedRateLimit } from './consistentRateLimiting';
import { supabase } from '@/integrations/supabase/client';

export interface MonitoringAlert {
  id: string;
  type: 'rate_limit' | 'error_spike' | 'performance' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  rateLimitHits: number;
  errorCount: number;
  avgResponseTime: number;
  activeUsers: number;
  systemLoad: number;
}

class IntegratedMonitoringSystem {
  private alerts: MonitoringAlert[] = [];
  private metrics: SystemMetrics = {
    rateLimitHits: 0,
    errorCount: 0,
    avgResponseTime: 0,
    activeUsers: 0,
    systemLoad: 0
  };
  private alertThresholds = {
    rateLimitHitsPerMinute: 50,
    errorCountPerMinute: 10,
    avgResponseTimeMs: 2000,
    criticalErrorTypes: ['DatabaseError', 'AuthenticationError', 'SecurityError']
  };

  // Enhanced rate limiting with monitoring integration
  async checkRateLimitWithMonitoring(
    identifier: string,
    action: string,
    customConfig?: any
  ) {
    const startTime = performance.now();
    
    try {
      // Check both standard and enhanced rate limits
      const [standardResult, enhancedResult] = await Promise.all([
        checkRateLimit(identifier, action, customConfig),
        checkEnhancedRateLimit(identifier, action, customConfig)
      ]);

      // Use the more restrictive result
      const result = !standardResult.allowed || !enhancedResult.allowed 
        ? (standardResult.allowed ? enhancedResult : standardResult)
        : standardResult;

      // Record metrics
      this.metrics.rateLimitHits++;
      monitoring.recordMetric('integrated_rate_limit_check', 1, {
        action,
        allowed: result.allowed.toString(),
        blocked: result.blocked.toString(),
        identifier_type: identifier.includes('@') ? 'email' : 'user_id'
      });

      // Check for rate limiting alerts
      if (result.blocked) {
        await this.checkRateLimitAlerts(action, identifier, result);
      }

      return result;
    } catch (error) {
      await handleCentralizedError(error as Error, 'integrated_rate_limit_check', identifier);
      throw error;
    } finally {
      const endTime = performance.now();
      monitoring.recordMetric('integrated_rate_limit_duration', endTime - startTime, {
        action,
        identifier_type: identifier.includes('@') ? 'email' : 'user_id'
      });
    }
  }

  // Enhanced error handling with monitoring
  async handleErrorWithMonitoring(
    error: Error,
    context: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    try {
      // Increment error count
      this.metrics.errorCount++;
      
      // Log error with centralized handling
      await handleCentralizedError(error, context, userId, metadata);
      
      // Check for error spike alerts
      await this.checkErrorAlerts(error, context);
      
      // Record monitoring metrics
      monitoring.recordMetric('integrated_error_handled', 1, {
        error_type: error.constructor.name,
        context,
        user_id: userId || 'anonymous'
      });

    } catch (handlingError) {
      console.error('Error in integrated monitoring error handler:', handlingError);
      console.error('Original error:', error);
    }
  }

  // Performance monitoring with alerting
  async recordPerformanceMetric(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    try {
      // Update average response time
      this.metrics.avgResponseTime = (this.metrics.avgResponseTime + duration) / 2;
      
      // Record in monitoring system
      monitoring.recordMetric('integrated_performance', duration, {
        operation,
        ...metadata
      });
      
      // Check for performance alerts
      if (duration > this.alertThresholds.avgResponseTimeMs) {
        await this.createAlert({
          type: 'performance',
          severity: duration > this.alertThresholds.avgResponseTimeMs * 2 ? 'high' : 'medium',
          message: `Slow performance detected for ${operation}: ${duration.toFixed(2)}ms`,
          metadata: { operation, duration, ...metadata }
        });
      }
      
    } catch (error) {
      console.error('Error recording performance metric:', error);
    }
  }

  // Security monitoring integration
  async recordSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    userId?: string
  ) {
    try {
      // Log security event
      monitoring.recordMetric('security_event', 1, {
        event_type: eventType,
        severity,
        user_id: userId || 'anonymous'
      });
      
      // Create security alert
      await this.createAlert({
        type: 'security',
        severity,
        message: `Security event detected: ${eventType}`,
        metadata: { ...details, user_id: userId }
      });
      
      // Log to error system if high severity
      if (severity === 'high' || severity === 'critical') {
        await handleCentralizedError(
          new Error(`Security event: ${eventType}`),
          'security_monitoring',
          userId,
          details
        );
      }
      
    } catch (error) {
      console.error('Error recording security event:', error);
    }
  }

  // System health monitoring
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    metrics: SystemMetrics;
    alerts: MonitoringAlert[];
  }> {
    try {
      // Calculate system status based on metrics and alerts
      const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
      const highAlerts = this.alerts.filter(a => a.severity === 'high').length;
      
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      
      if (criticalAlerts > 0 || this.metrics.errorCount > 50) {
        status = 'error';
      } else if (highAlerts > 0 || this.metrics.errorCount > 20 || this.metrics.rateLimitHits > 100) {
        status = 'warning';
      }
      
      return {
        status,
        metrics: { ...this.metrics },
        alerts: [...this.alerts]
      };
      
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        status: 'error',
        metrics: this.metrics,
        alerts: this.alerts
      };
    }
  }

  // Alert management
  private async createAlert(alert: Omit<MonitoringAlert, 'id' | 'timestamp'>) {
    const newAlert: MonitoringAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...alert
    };
    
    this.alerts.unshift(newAlert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
    
    // Log alert to monitoring system
    monitoring.recordMetric('alert_created', 1, {
      alert_type: alert.type,
      severity: alert.severity
    });
    
    console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.metadata);
  }

  // Rate limit alert checking
  private async checkRateLimitAlerts(action: string, identifier: string, result: any) {
    try {
      // Check recent rate limit hits
      const recentHits = await this.getRateLimitHitsInWindow(action, 5); // 5 minute window
      
      if (recentHits > this.alertThresholds.rateLimitHitsPerMinute) {
        await this.createAlert({
          type: 'rate_limit',
          severity: recentHits > this.alertThresholds.rateLimitHitsPerMinute * 2 ? 'high' : 'medium',
          message: `High rate limit activity detected for ${action}: ${recentHits} hits in 5 minutes`,
          metadata: { action, identifier, recentHits, result }
        });
      }
      
    } catch (error) {
      console.error('Error checking rate limit alerts:', error);
    }
  }

  // Error alert checking
  private async checkErrorAlerts(error: Error, context: string) {
    try {
      // Check for critical error types
      if (this.alertThresholds.criticalErrorTypes.includes(error.constructor.name)) {
        await this.createAlert({
          type: 'error_spike',
          severity: 'critical',
          message: `Critical error detected: ${error.constructor.name} in ${context}`,
          metadata: { error_type: error.constructor.name, context, message: error.message }
        });
      }
      
      // Check recent error count
      const recentErrors = await this.getErrorCountInWindow(5); // 5 minute window
      
      if (recentErrors > this.alertThresholds.errorCountPerMinute) {
        await this.createAlert({
          type: 'error_spike',
          severity: 'high',
          message: `Error spike detected: ${recentErrors} errors in 5 minutes`,
          metadata: { recent_errors: recentErrors, context }
        });
      }
      
    } catch (error) {
      console.error('Error checking error alerts:', error);
    }
  }

  // Helper methods for database queries
  private async getRateLimitHitsInWindow(action: string, windowMinutes: number): Promise<number> {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
      
      const { count } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact' })
        .eq('action', action)
        .gte('created_at', windowStart.toISOString());
      
      return count || 0;
    } catch (error) {
      console.error('Error getting rate limit hits:', error);
      return 0;
    }
  }

  private async getErrorCountInWindow(windowMinutes: number): Promise<number> {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
      
      const { count } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', windowStart.toISOString());
      
      return count || 0;
    } catch (error) {
      console.error('Error getting error count:', error);
      return 0;
    }
  }

  // Cleanup old alerts
  clearOldAlerts(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  // Reset metrics (call periodically)
  resetMetrics() {
    this.metrics = {
      rateLimitHits: 0,
      errorCount: 0,
      avgResponseTime: 0,
      activeUsers: 0,
      systemLoad: 0
    };
  }
}

// Export singleton instance
export const integratedMonitoring = new IntegratedMonitoringSystem();

// Convenience functions
export const checkRateLimitWithMonitoring = integratedMonitoring.checkRateLimitWithMonitoring.bind(integratedMonitoring);
export const handleErrorWithMonitoring = integratedMonitoring.handleErrorWithMonitoring.bind(integratedMonitoring);
export const recordPerformanceMetric = integratedMonitoring.recordPerformanceMetric.bind(integratedMonitoring);
export const recordSecurityEvent = integratedMonitoring.recordSecurityEvent.bind(integratedMonitoring);
export const getSystemHealth = integratedMonitoring.getSystemHealth.bind(integratedMonitoring);
