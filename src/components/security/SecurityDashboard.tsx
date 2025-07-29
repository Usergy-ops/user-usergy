
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Eye, Activity } from 'lucide-react';
import { enhancedSecurity, getSecurityMetrics } from '@/utils/enhancedSecurity';
import { monitoring } from '@/utils/monitoring';
import { integratedMonitoring, getSystemHealth } from '@/utils/integratedMonitoring';

const SecurityDashboard: React.FC = () => {
  const [securityMetrics, setSecurityMetrics] = useState(getSecurityMetrics());
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [recentThreats, setRecentThreats] = useState(enhancedSecurity.getRecentThreats(24));

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        setSecurityMetrics(getSecurityMetrics());
        setRecentThreats(enhancedSecurity.getRecentThreats(24));
        
        const health = await getSystemHealth();
        setSystemHealth(health);
      } catch (error) {
        console.error('Error updating security metrics:', error);
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${systemHealth ? getStatusColor(systemHealth.status) : 'text-gray-600'}`}>
              {systemHealth ? systemHealth.status.toUpperCase() : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemHealth ? `${systemHealth.alertCount} active alerts` : 'Checking status...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.threatCount}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.blockedAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Currently blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth ? systemHealth.errorRate : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Errors per 5 min
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="threats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="threats">Recent Threats</TabsTrigger>
          <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Threats</CardTitle>
              <CardDescription>
                Security events detected in the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentThreats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No security threats detected in the last 24 hours</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentThreats.slice(0, 10).map((threat, index) => (
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                          <span className="font-medium">{threat.type.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {threat.timestamp.toLocaleString()}
                        </p>
                        {threat.details.attempts && (
                          <p className="text-sm">
                            {threat.details.attempts} attempts detected
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>
                Real-time system monitoring metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Average Response Time</label>
                    <div className="text-2xl font-bold">
                      {systemHealth.avgResponseTime.toFixed(0)}ms
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Error</label>
                    <div className="text-sm text-muted-foreground">
                      {systemHealth.lastError 
                        ? new Date(systemHealth.lastError).toLocaleString()
                        : 'No recent errors'
                      }
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Alerts</CardTitle>
              <CardDescription>
                Current security alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityMetrics.suspiciousIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active security alerts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityMetrics.suspiciousIPs.map((ip, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Suspicious IP address detected: {ip}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;

