
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { monitorAccountTypeCoverage } from '@/utils/accountTypeUtils';
import { CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

interface SystemHealthData {
  total_users: number;
  users_with_account_types: number;
  users_without_account_types: number;
  coverage_percentage: number;
  is_healthy: boolean;
  timestamp: string;
}

interface SystemHealthIndicatorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showDetails?: boolean;
}

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute
  showDetails = false
}) => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await monitorAccountTypeCoverage();
      setHealthData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getHealthStatus = () => {
    if (loading) return { icon: RefreshCw, color: 'text-blue-600', label: 'Loading...', variant: 'secondary' as const };
    if (error) return { icon: AlertCircle, color: 'text-red-600', label: 'Error', variant: 'destructive' as const };
    if (!healthData) return { icon: AlertTriangle, color: 'text-yellow-600', label: 'Unknown', variant: 'secondary' as const };
    
    if (healthData.is_healthy) {
      return { icon: CheckCircle, color: 'text-green-600', label: 'Healthy', variant: 'default' as const };
    } else {
      return { icon: AlertTriangle, color: 'text-yellow-600', label: 'Issues Detected', variant: 'destructive' as const };
    }
  };

  const status = getHealthStatus();
  const Icon = status.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${loading ? 'animate-spin' : ''} ${status.color}`} />
          <span className="text-sm font-medium">System Health</span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        
        <Button
          onClick={fetchHealthData}
          disabled={loading}
          variant="ghost"
          size="sm"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {healthData && showDetails && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Total Users:</span>
            <Badge variant="outline">{healthData.total_users}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Coverage:</span>
            <Badge variant={healthData.coverage_percentage >= 95 ? 'default' : 'destructive'}>
              {healthData.coverage_percentage}%
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>With Types:</span>
            <Badge variant="default">{healthData.users_with_account_types}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Missing Types:</span>
            <Badge variant={healthData.users_without_account_types > 0 ? 'destructive' : 'outline'}>
              {healthData.users_without_account_types}
            </Badge>
          </div>
        </div>
      )}

      {healthData && (
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(healthData.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};
