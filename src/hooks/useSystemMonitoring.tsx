
import { useState, useEffect, useCallback } from 'react';
import { 
  monitorAccountTypeCoverage,
  fixExistingUsersWithoutAccountTypes,
  syncClientWorkflowIntegration,
  cleanupExpiredOTPRecords
} from '@/utils/accountTypeUtils';
import { monitoring } from '@/utils/monitoring';

interface SystemStats {
  total_users: number;
  users_with_account_types: number;
  users_without_account_types: number;
  coverage_percentage: number;
  is_healthy: boolean;
  timestamp: string;
}

interface FixResult {
  success: boolean;
  users_analyzed: number;
  users_fixed: number;
  message?: string;
  error?: string;
}

interface SystemMonitoringState {
  stats: SystemStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useSystemMonitoring = (autoRefresh: boolean = false, interval: number = 60000) => {
  const [state, setState] = useState<SystemMonitoringState>({
    stats: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      monitoring.startTiming('system_monitoring_fetch');
      const stats = await monitorAccountTypeCoverage();
      monitoring.endTiming('system_monitoring_fetch');
      
      setState({
        stats,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      monitoring.recordMetric('system_stats_fetched', 1, {
        coverage_percentage: stats.coverage_percentage.toString(),
        is_healthy: stats.is_healthy.toString()
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system stats';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      monitoring.logError(error as Error, 'system_monitoring_fetch_error');
    }
  }, []);

  const fixAccountTypes = useCallback(async (): Promise<FixResult> => {
    try {
      monitoring.startTiming('system_fix_account_types');
      const result = await fixExistingUsersWithoutAccountTypes();
      monitoring.endTiming('system_fix_account_types');
      
      // Refresh stats after fixing
      if (result.success) {
        setTimeout(fetchStats, 1000);
      }
      
      monitoring.recordMetric('system_account_types_fixed', 1, {
        success: result.success.toString(),
        users_fixed: result.users_fixed.toString()
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fix account types';
      monitoring.logError(error as Error, 'system_fix_account_types_error');
      
      return {
        success: false,
        users_analyzed: 0,
        users_fixed: 0,
        error: errorMessage
      };
    }
  }, [fetchStats]);

  const syncClientWorkflow = useCallback(async () => {
    try {
      monitoring.startTiming('system_sync_client_workflow');
      const result = await syncClientWorkflowIntegration();
      monitoring.endTiming('system_sync_client_workflow');
      
      monitoring.recordMetric('system_client_workflow_synced', 1, {
        success: result.success.toString()
      });
      
      return result;
    } catch (error) {
      monitoring.logError(error as Error, 'system_sync_client_workflow_error');
      throw error;
    }
  }, []);

  const cleanupOTPRecords = useCallback(async () => {
    try {
      monitoring.startTiming('system_cleanup_otp');
      await cleanupExpiredOTPRecords();
      monitoring.endTiming('system_cleanup_otp');
      
      monitoring.recordMetric('system_otp_cleanup_completed', 1);
    } catch (error) {
      monitoring.logError(error as Error, 'system_cleanup_otp_error');
      throw error;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh effect
  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      const timer = setInterval(fetchStats, interval);
      return () => clearInterval(timer);
    }
  }, [fetchStats, autoRefresh, interval]);

  return {
    ...state,
    actions: {
      refresh,
      fixAccountTypes,
      syncClientWorkflow,
      cleanupOTPRecords
    }
  };
};
