
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { enhancedMonitoring, getSystemHealthMetrics, triggerSystemCleanup } from '@/utils/enhancedMonitoring';
import { getErrorStatistics } from '@/utils/enhancedErrorHandling';
import { AlertCircle, CheckCircle, Clock, Activity, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface SystemHealth {
  avgResponseTime: number;
  errorRate: number;
  activeOperations: number;
  systemLoad: number;
}

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  errorsByType: Record<string, number>;
  errorsByComponent: Record<string, number>;
}

export const EnhancedMonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    avgResponseTime: 0,
    errorRate: 0,
    activeOperations: 0,
    systemLoad: 0
  });
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    totalErrors: 0,
    criticalErrors: 0,
    errorsByType: {},
    errorsByComponent: {}
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cleanupInProgress, setCleanupInProgress] = useState(false);

  const fetchMonitoringData = async () => {
    try {
      setRefreshing(true);
      
      const [healthMetrics, errorMetrics] = await Promise.all([
        getSystemHealthMetrics(3600), // Last hour
        getErrorStatistics(3600)
      ]);

      setSystemHealth(healthMetrics);
      setErrorStats(errorMetrics);
      
    } catch (error) {
      console.error('Error fetching enhanced monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setCleanupInProgress(true);
      const result = await triggerSystemCleanup();
      console.log('Cleanup completed:', result);
      await fetchMonitoringData(); // Refresh data after cleanup
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      setCleanupInProgress(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getHealthStatus = (): 'healthy' | 'warning' | 'error' => {
    if (systemHealth.systemLoad > 80 || errorStats.criticalErrors > 5) {
      return 'error';
    } else if (systemHealth.systemLoad > 60 || errorStats.totalErrors > 10) {
      return 'warning';
    }
    return 'healthy';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
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

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Enhanced System Monitoring</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={healthStatus === 'healthy' ? 'default' : healthStatus === 'warning' ? 'secondary' : 'destructive'}>
            <span className={`flex items-center space-x-1 ${getHealthColor(healthStatus)}`}>
              {getHealthIcon(healthStatus)}
              <span>{healthStatus.toUpperCase()}</span>
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

      {/* System Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Avg Response Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.avgResponseTime}ms</div>
            <Progress value={Math.min(100, (systemHealth.avgResponseTime / 2000) * 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {systemHealth.avgResponseTime < 500 ? 'Excellent' : 
               systemHealth.avgResponseTime < 1000 ? 'Good' : 
               systemHealth.avgResponseTime < 2000 ? 'Average' : 'Slow'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Error Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(systemHealth.errorRate * 100).toFixed(2)}%</div>
            <Progress value={systemHealth.errorRate * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {systemHealth.errorRate < 0.01 ? 'Excellent' : 
               systemHealth.errorRate < 0.05 ? 'Good' : 
               systemHealth.errorRate < 0.1 ? 'Concerning' : 'Critical'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Active Operations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.activeOperations}</div>
            <p className="text-xs text-muted-foreground">Operations in the last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>System Load</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.systemLoad}%</div>
            <Progress value={systemHealth.systemLoad} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {systemHealth.systemLoad < 40 ? 'Low' : 
               systemHealth.systemLoad < 70 ? 'Moderate' : 
               systemHealth.systemLoad < 90 ? 'High' : 'Critical'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Error Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Errors</span>
                <Badge variant="secondary">{errorStats.totalErrors}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Critical Errors</span>
                <Badge variant={errorStats.criticalErrors > 0 ? 'destructive' : 'default'}>
                  {errorStats.criticalErrors}
                </Badge>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Errors by Type</h4>
                <div className="space-y-2">
                  {Object.entries(errorStats.errorsByType).slice(0, 5).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span>{type}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5" />
              <span>Component Errors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(errorStats.errorsByComponent).slice(0, 8).map(([component, count]) => (
                <div key={component} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{component}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {Object.keys(errorStats.errorsByComponent).length === 0 && (
                <p className="text-sm text-muted-foreground">No component errors in the last hour</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>System Maintenance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Comprehensive System Cleanup</div>
              <div className="text-sm text-muted-foreground">
                Cleans up expired sessions, old metrics, performance logs, and more
              </div>
            </div>
            <Button 
              onClick={handleCleanup} 
              disabled={cleanupInProgress}
              variant="outline"
            >
              {cleanupInProgress ? 'Running...' : 'Run Cleanup'}
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Automatic cleanup includes:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Expired user sessions (30+ days old)</li>
              <li>Old system metrics (30+ days old)</li>
              <li>Old performance logs (7+ days old)</li>
              <li>Expired OTP codes</li>
              <li>Old rate limit records</li>
              <li>Resolved error logs</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Health Alerts */}
      {healthStatus !== 'healthy' && (
        <Alert variant={healthStatus === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {healthStatus === 'error' 
              ? 'System is experiencing high load or critical errors. Immediate attention required.'
              : 'System performance is degraded. Monitor closely and consider taking action if metrics worsen.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
