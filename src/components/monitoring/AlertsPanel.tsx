
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { integratedMonitoring, MonitoringAlert } from '@/utils/integratedMonitoring';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const healthData = await integratedMonitoring.getSystemHealth();
      setAlerts(healthData.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 10 seconds
    const interval = setInterval(fetchAlerts, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'text-red-600';
      case 'error_spike': return 'text-orange-600';
      case 'rate_limit': return 'text-yellow-600';
      case 'performance': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const clearOldAlerts = () => {
    integratedMonitoring.clearOldAlerts();
    fetchAlerts();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>System Alerts</span>
            <Badge variant="secondary">{alerts.length}</Badge>
          </CardTitle>
          <Button onClick={clearOldAlerts} variant="outline" size="sm">
            <X className="h-4 w-4 mr-1" />
            Clear Old
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active alerts</p>
                <p className="text-sm">System is operating normally</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <Alert key={alert.id} variant={getSeverityColor(alert.severity) as any}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <AlertDescription>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={getTypeColor(alert.type)}>
                              {alert.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant={getSeverityColor(alert.severity) as any}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-2">{alert.message}</p>
                        {alert.metadata && (
                          <div className="text-xs text-muted-foreground">
                            <details className="cursor-pointer">
                              <summary className="hover:text-foreground">View details</summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(alert.metadata, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
