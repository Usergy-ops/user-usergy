
import React from 'react';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { AlertsPanel } from '@/components/monitoring/AlertsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { integratedMonitoring } from '@/utils/integratedMonitoring';
import { Activity, Shield, AlertTriangle, Clock } from 'lucide-react';

export const SystemMonitoring: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<{
    status: 'healthy' | 'warning' | 'error';
    metrics: any;
    alerts: any[];
  } | null>(null);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const health = await integratedMonitoring.getSystemHealth();
        setSystemHealth(health);
      } catch (error) {
        console.error('Error fetching system health:', error);
      }
    };

    fetchSystemHealth();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Activity className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'error': return <AlertTriangle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">System Monitoring</h1>
              <p className="text-muted-foreground">
                Real-time monitoring and alerting for application health
              </p>
            </div>
            {systemHealth && (
              <div className="flex items-center space-x-2">
                <span className={`flex items-center space-x-2 ${getStatusColor(systemHealth.status)}`}>
                  {getStatusIcon(systemHealth.status)}
                  <span className="font-medium">{systemHealth.status.toUpperCase()}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Limiting</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Tracking</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Enhanced Monitoring</span>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <Badge variant="outline">
                    {systemHealth?.metrics?.avgResponseTime?.toFixed(0) || 0}ms
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Rate</span>
                  <Badge variant="outline">
                    {systemHealth?.metrics?.errorCount || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Limit Hits</span>
                  <Badge variant="outline">
                    {systemHealth?.metrics?.rateLimitHits || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="outline">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto Cleanup</span>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <MonitoringDashboard />
          </div>
          <div>
            <AlertsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
