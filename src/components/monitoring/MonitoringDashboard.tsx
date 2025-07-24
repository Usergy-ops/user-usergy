
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';
import { AlertCircle, CheckCircle, Clock, Activity } from 'lucide-react';

interface MonitoringStats {
  rateLimitBlocked: number;
  errorLogCount: number;
  enhancedRateLimitBlocked: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  lastCleanup: string | null;
}

interface ErrorLogEntry {
  id: string;
  error_type: string;
  error_message: string;
  context: string;
  created_at: string;
  resolved: boolean;
}

export const MonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState<MonitoringStats>({
    rateLimitBlocked: 0,
    errorLogCount: 0,
    enhancedRateLimitBlocked: 0,
    systemHealth: 'healthy',
    lastCleanup: null
  });
  const [recentErrors, setRecentErrors] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonitoringData = async () => {
    try {
      setRefreshing(true);
      monitoring.startTiming('dashboard_data_fetch');

      // Fetch rate limit statistics
      const { data: rateLimitData } = await supabase
        .from('rate_limits')
        .select('blocked_until')
        .not('blocked_until', 'is', null)
        .gte('blocked_until', new Date().toISOString());

      const { data: enhancedRateLimitData } = await supabase
        .from('enhanced_rate_limits')
        .select('blocked_until')
        .not('blocked_until', 'is', null)
        .gte('blocked_until', new Date().toISOString());

      // Fetch error logs
      const { data: errorLogData } = await supabase
        .from('error_logs')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent errors for display
      const { data: recentErrorData } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate system health
      const errorCount = errorLogData?.length || 0;
      const rateLimitBlocked = rateLimitData?.length || 0;
      const enhancedRateLimitBlocked = enhancedRateLimitData?.length || 0;

      let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy';
      if (errorCount > 10 || rateLimitBlocked > 50) {
        systemHealth = 'error';
      } else if (errorCount > 5 || rateLimitBlocked > 20) {
        systemHealth = 'warning';
      }

      setStats({
        rateLimitBlocked,
        errorLogCount: errorCount,
        enhancedRateLimitBlocked,
        systemHealth,
        lastCleanup: new Date().toISOString()
      });

      setRecentErrors(recentErrorData || []);

      monitoring.recordMetric('dashboard_data_fetched', 1, {
        error_count: errorCount.toString(),
        rate_limit_blocked: rateLimitBlocked.toString(),
        system_health: systemHealth
      });

    } catch (error) {
      monitoring.logError(error as Error, 'monitoring_dashboard_fetch', {
        operation: 'fetch_monitoring_data'
      });
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      monitoring.endTiming('dashboard_data_fetch');
    }
  };

  const triggerCleanup = async () => {
    try {
      monitoring.startTiming('manual_cleanup');
      
      // Import and run cleanup functions
      const { performComprehensiveCleanup } = await import('@/utils/cleanup');
      await performComprehensiveCleanup();
      
      monitoring.recordMetric('manual_cleanup_triggered', 1, {
        triggered_by: 'dashboard'
      });
      
      // Refresh data after cleanup
      await fetchMonitoringData();
      
    } catch (error) {
      monitoring.logError(error as Error, 'manual_cleanup_error', {
        triggered_by: 'dashboard'
      });
      console.error('Error during manual cleanup:', error);
    } finally {
      monitoring.endTiming('manual_cleanup');
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Set up periodic refresh
    const interval = setInterval(fetchMonitoringData, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertCircle className="h-5 w-5" />;
      case 'error': return <AlertCircle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Monitoring Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={stats.systemHealth === 'healthy' ? 'default' : stats.systemHealth === 'warning' ? 'secondary' : 'destructive'}>
            <span className={`flex items-center space-x-1 ${getHealthColor(stats.systemHealth)}`}>
              {getHealthIcon(stats.systemHealth)}
              <span>{stats.systemHealth.toUpperCase()}</span>
            </span>
          </Badge>
          <Button 
            onClick={fetchMonitoringData} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rateLimitBlocked}</div>
            <p className="text-xs text-muted-foreground">Currently blocked requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enhanced Rate Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enhancedRateLimitBlocked}</div>
            <p className="text-xs text-muted-foreground">Enhanced blocks active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unresolved Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errorLogCount}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(stats.systemHealth)}`}>
              {stats.systemHealth.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground">Overall system status</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Recent Errors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentErrors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent errors</p>
              ) : (
                recentErrors.map((error) => (
                  <Alert key={error.id} variant={error.resolved ? "default" : "destructive"}>
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{error.error_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {error.error_message.length > 50 
                              ? `${error.error_message.substring(0, 50)}...` 
                              : error.error_message}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {error.context} • {new Date(error.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={error.resolved ? "default" : "destructive"}>
                          {error.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>System Maintenance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Database Cleanup</div>
                  <div className="text-sm text-muted-foreground">
                    Last run: {stats.lastCleanup ? new Date(stats.lastCleanup).toLocaleString() : 'Never'}
                  </div>
                </div>
                <Button onClick={triggerCleanup} variant="outline" size="sm">
                  Run Cleanup
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Automatic cleanup runs every 6 hours to:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Remove expired OTP codes</li>
                  <li>Clean old rate limit records</li>
                  <li>Archive resolved error logs</li>
                  <li>Optimize database performance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
