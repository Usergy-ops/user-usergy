/**
 * Enhanced monitoring utilities with integrated alerting
 */

interface MonitoringMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface MonitoringLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class MonitoringSystem {
  private metrics: MonitoringMetric[] = [];
  private logs: MonitoringLog[] = [];
  private timings: Map<string, number> = new Map();
  private alerts: any[] = [];

  // Enhanced metric recording with alerting
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: MonitoringMetric = {
      name,
      value,
      timestamp: new Date(),
      tags
    };
    
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[METRIC] ${name}: ${value}`, tags);
    }
    
    // Check for anomalies and create alerts
    this.checkMetricAnomalies(metric);
  }

  // Enhanced logging with context
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context: string, metadata?: Record<string, any>) {
    const log: MonitoringLog = {
      level,
      message,
      context,
      timestamp: new Date(),
      metadata
    };
    
    this.logs.push(log);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Always log to console
    const logMethod = console[level] || console.log;
    logMethod(`[${level.toUpperCase()}] [${context}] ${message}`, metadata);
  }

  // Convenience logging methods
  debug(message: string, context: string = 'debug', metadata?: Record<string, any>) {
    this.log('debug', message, context, metadata);
  }

  info(message: string, context: string = 'info', metadata?: Record<string, any>) {
    this.log('info', message, context, metadata);
  }

  warn(message: string, context: string = 'warn', metadata?: Record<string, any>) {
    this.log('warn', message, context, metadata);
  }

  error(message: string, context: string = 'error', metadata?: Record<string, any>) {
    this.log('error', message, context, metadata);
  }

  // Enhanced error logging with automatic alerting
  logError(error: Error, context: string = 'error', metadata?: Record<string, any>) {
    const errorLog: MonitoringLog = {
      level: 'error',
      message: error.message,
      context,
      timestamp: new Date(),
      metadata: {
        name: error.name,
        stack: error.stack,
        ...metadata
      }
    };
    
    this.logs.push(errorLog);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Console logging
    console.error(`[ERROR] [${context}] ${error.message}`, {
      name: error.name,
      stack: error.stack,
      ...metadata
    });
    
    // Record error metric
    this.recordMetric('error_count', 1, {
      error_type: error.name,
      context
    });
  }

  // Performance timing
  startTiming(operation: string) {
    this.timings.set(operation, performance.now());
  }

  endTiming(operation: string) {
    const startTime = this.timings.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric('operation_duration', duration, { operation });
      this.timings.delete(operation);
      return duration;
    }
    return 0;
  }

  // Performance monitoring wrapper
  async measureOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(operation);
    try {
      const result = await fn();
      this.endTiming(operation);
      return result;
    } catch (error) {
      this.endTiming(operation);
      this.logError(error as Error, operation);
      throw error;
    }
  }

  // Anomaly detection for metrics
  private checkMetricAnomalies(metric: MonitoringMetric) {
    try {
      // Get historical data for this metric
      const historicalMetrics = this.metrics.filter(m => 
        m.name === metric.name && 
        m.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
      );

      if (historicalMetrics.length < 5) return; // Need at least 5 data points

      // Calculate average and standard deviation
      const values = historicalMetrics.map(m => m.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / values.length);

      // Check for anomalies (value is more than 2 standard deviations from mean)
      const threshold = 2;
      if (Math.abs(metric.value - avg) > threshold * stdDev) {
        this.createAlert({
          type: 'anomaly',
          severity: 'medium',
          message: `Anomaly detected in ${metric.name}: ${metric.value} (avg: ${avg.toFixed(2)}, stddev: ${stdDev.toFixed(2)})`,
          metric: metric.name,
          value: metric.value,
          average: avg,
          standardDeviation: stdDev
        });
      }
    } catch (error) {
      // Don't let anomaly detection break the system
      console.error('Error in anomaly detection:', error);
    }
  }

  // Alert creation
  private createAlert(alert: any) {
    this.alerts.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...alert
    });
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Log alert
    this.warn(`ALERT: ${alert.message}`, 'monitoring_alert', alert);
  }

  // Data retrieval methods
  getMetrics(timeRange?: { start: Date; end: Date }): MonitoringMetric[] {
    if (!timeRange) return [...this.metrics];
    
    return this.metrics.filter(m => 
      m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  getLogs(level?: 'debug' | 'info' | 'warn' | 'error', context?: string): MonitoringLog[] {
    let filteredLogs = [...this.logs];
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (context) {
      filteredLogs = filteredLogs.filter(log => log.context.includes(context));
    }
    
    return filteredLogs;
  }

  getAlerts(): any[] {
    return [...this.alerts];
  }

  // System health assessment
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'error';
    errorRate: number;
    avgResponseTime: number;
    alertCount: number;
    lastError?: Date;
  } {
    const recentErrors = this.logs.filter(log => 
      log.level === 'error' && 
      log.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
    );
    
    const recentMetrics = this.metrics.filter(m => 
      m.name === 'operation_duration' && 
      m.timestamp.getTime() > Date.now() - 300000
    );
    
    const errorRate = recentErrors.length;
    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length 
      : 0;
    
    const alertCount = this.alerts.filter(a => 
      a.timestamp.getTime() > Date.now() - 300000
    ).length;
    
    const lastError = recentErrors.length > 0 
      ? recentErrors[recentErrors.length - 1].timestamp 
      : undefined;
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (errorRate > 10 || avgResponseTime > 5000 || alertCount > 5) {
      status = 'error';
    } else if (errorRate > 5 || avgResponseTime > 2000 || alertCount > 2) {
      status = 'warning';
    }
    
    return {
      status,
      errorRate,
      avgResponseTime,
      alertCount,
      lastError
    };
  }

  // Cleanup old data
  cleanup(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.logs = this.logs.filter(l => l.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  // Export data for analysis
  exportData(): {
    metrics: MonitoringMetric[];
    logs: MonitoringLog[];
    alerts: any[];
    systemHealth: ReturnType<typeof this.getSystemHealth>;
  } {
    return {
      metrics: this.getMetrics(),
      logs: this.getLogs(),
      alerts: this.getAlerts(),
      systemHealth: this.getSystemHealth()
    };
  }
}

// Export singleton instance
export const monitoring = new MonitoringSystem();

// Start cleanup interval
setInterval(() => {
  monitoring.cleanup();
}, 60 * 60 * 1000); // Cleanup every hour
