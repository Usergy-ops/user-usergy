
/**
 * Comprehensive monitoring and logging system
 */

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

interface ErrorMetric {
  error: Error;
  context: string;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  url?: string;
}

class MonitoringService {
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private sessionId: string;
  private maxLogSize = 1000;
  private maxMetricSize = 500;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandler();
    this.setupPerformanceObserver();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandler() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.logError(new Error(event.message), 'global_error_handler', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        new Error(`Unhandled promise rejection: ${event.reason}`),
        'unhandled_promise_rejection'
      );
    });
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
            this.recordMetric('time_to_interactive', navEntry.loadEventEnd - navEntry.fetchStart);
          }
        });
      });

      navObserver.observe({ type: 'navigation', buffered: true });

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric('resource_load_time', resourceEntry.responseEnd - resourceEntry.startTime, {
              resource_name: resourceEntry.name,
              resource_type: resourceEntry.initiatorType
            });
          }
        });
      });

      resourceObserver.observe({ type: 'resource', buffered: true });

      // Observe user timing
      const userObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.recordMetric('user_timing', entry.duration, {
              measure_name: entry.name
            });
          }
        });
      });

      userObserver.observe({ type: 'measure', buffered: true });
    }
  }

  // Enhanced logging methods
  log(level: LogEntry['level'], message: string, context?: string, metadata?: Record<string, any>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
      sessionId: this.sessionId
    };

    this.logs.push(logEntry);
    
    // Trim logs if exceeding max size
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Console output with appropriate level
    switch (level) {
      case 'error':
        console.error(`[${context || 'APP'}] ${message}`, metadata);
        break;
      case 'warn':
        console.warn(`[${context || 'APP'}] ${message}`, metadata);
        break;
      case 'debug':
        console.debug(`[${context || 'APP'}] ${message}`, metadata);
        break;
      default:
        console.log(`[${context || 'APP'}] ${message}`, metadata);
    }
  }

  info(message: string, context?: string, metadata?: Record<string, any>) {
    this.log('info', message, context, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    this.log('warn', message, context, metadata);
  }

  error(message: string, context?: string, metadata?: Record<string, any>) {
    this.log('error', message, context, metadata);
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    this.log('debug', message, context, metadata);
  }

  // Error tracking
  logError(error: Error, context: string, metadata?: Record<string, any>) {
    const errorMetric: ErrorMetric = {
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(errorMetric);
    
    this.log('error', `${error.name}: ${error.message}`, context, {
      ...metadata,
      stack: error.stack,
      errorType: error.constructor.name
    });
  }

  // Performance metrics
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      tags
    };

    this.metrics.push(metric);
    
    // Trim metrics if exceeding max size
    if (this.metrics.length > this.maxMetricSize) {
      this.metrics = this.metrics.slice(-this.maxMetricSize);
    }

    this.debug(`Metric recorded: ${name} = ${value}`, 'performance_monitoring', tags);
  }

  // Custom timing measurements
  startTiming(name: string) {
    performance.mark(`${name}_start`);
  }

  endTiming(name: string) {
    performance.mark(`${name}_end`);
    performance.measure(name, `${name}_start`, `${name}_end`);
  }

  // Database operation monitoring
  monitorDatabaseOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: string
  ): Promise<T> {
    const startTime = performance.now();
    this.startTiming(`db_${operationName}`);
    
    return operation()
      .then(result => {
        const endTime = performance.now();
        this.endTiming(`db_${operationName}`);
        
        this.recordMetric(`database_operation_duration`, endTime - startTime, {
          operation: operationName,
          status: 'success'
        });
        
        this.info(`Database operation completed: ${operationName}`, context, {
          duration: endTime - startTime,
          status: 'success'
        });
        
        return result;
      })
      .catch(error => {
        const endTime = performance.now();
        this.endTiming(`db_${operationName}`);
        
        this.recordMetric(`database_operation_duration`, endTime - startTime, {
          operation: operationName,
          status: 'error'
        });
        
        this.logError(error, context || `database_${operationName}`, {
          operation: operationName,
          duration: endTime - startTime
        });
        
        throw error;
      });
  }

  // Rate limiting monitoring
  monitorRateLimit(identifier: string, action: string, allowed: boolean, attemptsRemaining?: number) {
    this.recordMetric('rate_limit_check', allowed ? 1 : 0, {
      identifier,
      action,
      attempts_remaining: attemptsRemaining?.toString()
    });
    
    if (!allowed) {
      this.warn(`Rate limit exceeded for ${action}`, 'rate_limiting', {
        identifier,
        action,
        attemptsRemaining
      });
    }
  }

  // User action tracking
  trackUserAction(action: string, metadata?: Record<string, any>) {
    this.recordMetric('user_action', 1, {
      action,
      ...metadata
    });
    
    this.info(`User action: ${action}`, 'user_tracking', metadata);
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      logs: this.logs,
      metrics: this.metrics,
      errors: this.errors.map(e => ({
        ...e,
        error: {
          name: e.error.name,
          message: e.error.message,
          stack: e.error.stack
        }
      }))
    }, null, 2);
  }

  // Clear logs (for memory management)
  clearLogs() {
    this.logs = [];
    this.metrics = [];
    this.errors = [];
    this.info('Logs cleared', 'monitoring_service');
  }

  // Get summary statistics
  getSummary() {
    const errorCount = this.errors.length;
    const logLevels = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgPerformance = this.metrics
      .filter(m => m.name.includes('duration'))
      .reduce((acc, m) => acc + m.value, 0) / this.metrics.length || 0;

    return {
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      totalErrors: errorCount,
      logLevels,
      averagePerformance: avgPerformance,
      metricsCount: this.metrics.length
    };
  }
}

// Global monitoring instance
export const monitoring = new MonitoringService();

// Convenience functions
export const trackUserAction = (action: string, metadata?: Record<string, any>) => {
  monitoring.trackUserAction(action, metadata);
};

export const recordMetric = (name: string, value: number, tags?: Record<string, string>) => {
  monitoring.recordMetric(name, value, tags);
};

export const logError = (error: Error, context: string, metadata?: Record<string, any>) => {
  monitoring.logError(error, context, metadata);
};

export const monitorDatabaseOperation = <T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: string
): Promise<T> => {
  return monitoring.monitorDatabaseOperation(operation, operationName, context);
};

export const exportLogs = () => monitoring.exportLogs();

export const getMonitoringSummary = () => monitoring.getSummary();
