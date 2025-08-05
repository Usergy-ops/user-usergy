
/**
 * System health check for final integration validation
 */

import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';
import { handleError } from '@/utils/errorHandling/index';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: Date;
}

export class SystemHealthChecker {
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: Record<string, boolean> = {};
    
    monitoring.startTiming('system_health_check');
    
    try {
      // Database connectivity
      checks.database = await this.checkDatabase();
      
      // Authentication system
      checks.auth = await this.checkAuth();
      
      // Storage system
      checks.storage = await this.checkStorage();
      
      // Error handling system
      checks.errorHandling = await this.checkErrorHandling();
      
      // Monitoring system
      checks.monitoring = this.checkMonitoring();
      
      const healthyChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.values(checks).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyChecks === totalChecks) {
        status = 'healthy';
      } else if (healthyChecks >= totalChecks * 0.7) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      monitoring.endTiming('system_health_check');
      
      return {
        status,
        checks,
        timestamp: new Date()
      };
    } catch (error) {
      monitoring.endTiming('system_health_check');
      console.error('Health check failed:', error);
      
      return {
        status: 'unhealthy',
        checks,
        timestamp: new Date()
      };
    }
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private async checkAuth(): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getSession();
      return data !== null; // Session can be null (logged out) or valid
    } catch (error) {
      console.error('Auth health check failed:', error);
      return false;
    }
  }

  private async checkStorage(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.from('profile-pictures').list('', { limit: 1 });
      return !error && Array.isArray(data);
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  }

  private async checkErrorHandling(): Promise<boolean> {
    try {
      // Test error handling system
      const testError = new Error('Health check test error');
      const result = await handleError(testError, 'health_check');
      return !!(result && result.id);
    } catch (error) {
      console.error('Error handling health check failed:', error);
      return false;
    }
  }

  private checkMonitoring(): boolean {
    try {
      monitoring.recordMetric('health_check_test', 1);
      return true;
    } catch (error) {
      console.error('Monitoring health check failed:', error);
      return false;
    }
  }
}

export const systemHealthChecker = new SystemHealthChecker();
