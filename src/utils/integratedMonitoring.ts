/**
 * Updated integrated monitoring system that uses the enhanced backend infrastructure
 * This replaces the previous version with better database integration
 */

import { enhancedMonitoring, recordSystemMetric, startTiming, endTiming } from './enhancedMonitoring';
import { enhancedErrorHandler, handleError, handleSecurityError } from './enhancedErrorHandling';
import { enhancedRateLimitEngine } from './rateLimit/enhancedCore';
import { RateLimitConfig } from './rateLimit/types';
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

  // Enhanced rate limiting with progressive escalation
  async checkRateLimitWithMonitoring(
    identifier: string,
    action: string,
    customConfig?: RateLimitConfig
  ) {
    const timerId = startTiming('rate_limit_check');
    
    try {
      // Use enhanced rate limiting with progressive escalation
      const result = customConfig
        ? await enhancedRateLimitEngine.checkRateLimit(identifier, action, customConfig)
        : await enhancedRateLimitEngine.checkProgressiveRateLimit(identifier, action, {
            maxAttempts: 10,
            windowMinutes: 60,
            blockDurationMinutes: 15
          });

      // Update metrics
      this.metrics.rateLimitHits++;
      
      // Record system metric
      await recordSystemMetric({
        metric_name: 'integrated_rate_limit_check',
        metric_value: 1,
        metric_type: 'counter',
        labels: {
          action,
          allowed: result.allowed.toString(),
          blocked: result.blocked.toString(),
          identifier_type: identifier.includes('@') ? 'email' : 'user_id'
        }
      });

      // Check for rate limiting alerts
      if (result.blocked) {
        await this.checkRateLimitAlerts(action, identifier, result);
      }

      return result;
    } catch (error) {
      await handleError(error as Error, 'integrated_rate_limit_check', 'rate_limit_engine', identifier);
      throw error;
    } finally {
      await endTiming(timerId, 'rate_limit_check', 'integrated_monitoring', identifier);
    }
  }

  // Enhanced error handling with automatic categorization
  async handleErrorWithMonitoring(
    error: Error,
    context: string,
    componentName?: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    try {
      // Increment error count
      this.metrics.errorCount++;
      
      // Use enhanced error handling
      await enhancedErrorHandler.handleError(error, context, componentName, userId, metadata);
      
      // Check for error spike alerts
      await this.checkErrorAlerts(error, context);
      
      // Record monitoring metrics
      await recordSystemMetric({
        metric_name: 'integrated_error_handled',
        metric_value: 1,
        metric_type: 'counter',
        labels: {
          error_type: error.constructor.name,
          context,
          component: componentName || 'unknown',
          user_id: userId || 'anonymous'
        }
      });

    } catch (handlingError) {
      console.error('Error in integrated monitoring error handler:', handlingError);
      console.error('Original error:', error);
    }
  }

  // Performance monitoring with enhanced logging
  async recordPerformanceMetric(
    operation: string,
    duration: number,
    componentName?: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    try {
      // Update average response time
      this.metrics.avgResponseTime = (this.metrics.avgResponseTime + duration) / 2;
      
      // Record in enhanced monitoring system
      await enhancedMonitoring.recordPerformanceLog({
        operation_name: operation,
        duration_ms: Math.round(duration),
        component_name: componentName,
        user_id: userId,
        metadata
      });
      
      // Check for performance alerts
      if (duration > this.alertThresholds.avgResponseTimeMs) {
        await this.createAlert({
          type: 'performance',
          severity: duration > this.alertThresholds.avgResponseTimeMs * 2 ? 'high' : 'medium',
          message: `Slow performance detected for ${operation}: ${duration.toFixed(2)}ms`,
          metadata: { operation, duration, component: componentName, ...metadata }
        });
      }
      
    } catch (error) {
      console.error('Error recording performance metric:', error);
    }
  }

  // Enhanced security monitoring
  async recordSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    userId?: string
  ) {
    try {
      // Record security metric
      await recordSystemMetric({
        metric_name: 'security_event',
        metric_value: 1,
        metric_type: 'counter',
        labels: {
          event_type: eventType,
          severity,
          user_id: userId || 'anonymous'
        }
      });
      
      // Create security alert
      await this.createAlert({
        type: 'security',
        severity,
        message: `Security event detected: ${eventType}`,
        metadata: { ...details, user_id: userId }
      });
      
      // Log to enhanced error system if high severity
      if (severity === 'high' || severity === 'critical') {
        await handleSecurityError(
          `Security event: ${eventType}`,
          eventType,
          userId,
          details
        );
      }
      
    } catch (error) {
      console.error('Error recording security event:', error);
    }
  }

  // Enhanced system health monitoring
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    metrics: SystemMetrics;
    alerts: MonitoringAlert[];
    detailedHealth: {
      avgResponseTime: number;
      errorRate: number;
      activeOperations: number;
      systemLoad: number;
    };
  }> {
    try {
      // Get enhanced system health metrics
      const detailedHealth = await enhancedMonitoring.getSystemHealthMetrics();
      
      // Calculate system status
      const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
      const highAlerts = this.alerts.filter(a => a.severity === 'high').length;
      
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      
      if (criticalAlerts > 0 || detailedHealth.systemLoad > 80) {
        status = 'error';
      } else if (highAlerts > 0 || detailedHealth.systemLoad > 60 || detailedHealth.errorRate > 0.05) {
        status = 'warning';
      }
      
      // Update local metrics with database metrics
      this.metrics.avgResponseTime = detailedHealth.avgResponseTime;
      this.metrics.systemLoad = detailedHealth.systemLoad;
      
      return {
        status,
        metrics: { ...this.metrics },
        alerts: [...this.alerts],
        detailedHealth
      };
      
    } catch (error) {
      console.error('Error getting enhanced system health:', error);
      return {
        status: 'error',
        metrics: this.metrics,
        alerts: this.alerts,
        detailedHealth: {
          avgResponseTime: 0,
          errorRate: 0,
          activeOperations: 0,
          systemLoad: 0
        }
      };
    }
  }

  // Alert management with database persistence
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
    
    // Log alert to enhanced error system
    await enhancedErrorHandler.logEnhancedError({
      error_type: 'monitoring_alert',
      error_message: alert.message,
      severity: alert.severity === 'critical' ? 'critical' : 
                alert.severity === 'high' ? 'error' : 'warning',
      context: 'integrated_monitoring',
      component_name: 'alert_system',
      metadata: {
        alert_type: alert.type,
        ...alert.metadata
      }
    });
    
    // Record alert metric
    await recordSystemMetric({
      metric_name: 'alert_created',
      metric_value: 1,
      metric_type: 'counter',
      labels: {
        alert_type: alert.type,
        severity: alert.severity
      }
    });
    
    console.warn(`[ENHANCED ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.metadata);
  }

  // Rate limit alert checking with database queries
  private async checkRateLimitAlerts(action: string, identifier: string, result: any) {
    try {
      // Check recent rate limit hits from database
      const recentHits = await this.getRateLimitHitsInWindow(action, 5);
      
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

  // Error alert checking with enhanced error statistics
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
      
      // Get recent error count from enhanced error handler
      const errorStats = await enhancedErrorHandler.getErrorStatistics(300); // 5 minutes
      
      if (errorStats.totalErrors > this.alertThresholds.errorCountPerMinute) {
        await this.createAlert({
          type: 'error_spike',
          severity: 'high',
          message: `Error spike detected: ${errorStats.totalErrors} errors in 5 minutes`,
          metadata: { 
            recent_errors: errorStats.totalErrors,
            critical_errors: errorStats.criticalErrors,
            context 
          }
        });
      }
      
    } catch (error) {
      console.error('Error checking error alerts:', error);
    }
  }

  // Enhanced database query helpers
  private async getRateLimitHitsInWindow(action: string, windowMinutes: number): Promise<number> {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
      
      const { count } = await supabase
        .from('enhanced_rate_limits')
        .select('*', { count: 'exact' })
        .eq('action', action)
        .gte('created_at', windowStart.toISOString());
      
      return count || 0;
    } catch (error) {
      console.error('Error getting rate limit hits:', error);
      return 0;
    }
  }

  // Comprehensive system cleanup
  async triggerSystemCleanup(): Promise<any> {
    try {
      const result = await enhancedMonitoring.triggerSystemCleanup();
      
      // Clear old alerts
      this.clearOldAlerts();
      
      // Reset metrics
      this.resetMetrics();
      
      await this.createAlert({
        type: 'performance',
        severity: 'low',
        message: 'System cleanup completed successfully',
        metadata: { cleanup_result: result }
      });
      
      return result;
    } catch (error) {
      console.error('Error during integrated system cleanup:', error);
      throw error;
    }
  }

  // Cleanup old alerts
  clearOldAlerts(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  // Reset metrics
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

// Export enhanced singleton instance
export const integratedMonitoring = new IntegratedMonitoringSystem();

// Enhanced convenience functions
export const checkRateLimitWithMonitoring = integratedMonitoring.checkRateLimitWithMonitoring.bind(integratedMonitoring);
export const handleErrorWithMonitoring = integratedMonitoring.handleErrorWithMonitoring.bind(integratedMonitoring);
export const recordPerformanceMetric = integratedMonitoring.recordPerformanceMetric.bind(integratedMonitoring);
export const recordSecurityEvent = integratedMonitoring.recordSecurityEvent.bind(integratedMonitoring);
export const getSystemHealth = integratedMonitoring.getSystemHealth.bind(integratedMonitoring);
export const triggerSystemCleanup = integratedMonitoring.triggerSystemCleanup.bind(integratedMonitoring);
