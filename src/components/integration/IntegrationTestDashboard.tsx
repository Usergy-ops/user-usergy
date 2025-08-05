
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { integrationTestRunner } from '@/utils/integration/integrationTests';
import { systemHealthChecker, type HealthCheckResult } from '@/utils/integration/healthCheck';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';

export const IntegrationTestDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);

  useEffect(() => {
    // Run initial health check
    runHealthCheck();
  }, []);

  const runIntegrationTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await integrationTestRunner.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Integration tests failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const runHealthCheck = async () => {
    setIsRunningHealthCheck(true);
    try {
      const result = await systemHealthChecker.performHealthCheck();
      setHealthCheck(result);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsRunningHealthCheck(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (passing: boolean) => {
    return passing ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Phase 5: Integration Testing Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={runIntegrationTests}
            disabled={isRunningTests}
            className="flex items-center space-x-2"
          >
            {isRunningTests ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isRunningTests ? 'Running Tests...' : 'Run Integration Tests'}</span>
          </Button>
          <Button 
            onClick={runHealthCheck}
            disabled={isRunningHealthCheck}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {isRunningHealthCheck ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isRunningHealthCheck ? 'Checking...' : 'Health Check'}</span>
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>System Health</span>
              <Badge className={getStatusColor(healthCheck.status)}>
                {healthCheck.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(healthCheck.checks).map(([check, passing]) => (
                <div key={check} className="flex items-center space-x-2">
                  {getStatusIcon(passing)}
                  <span className="text-sm capitalize">{check.replace(/([A-Z])/g, ' $1')}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Last checked: {healthCheck.timestamp.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Integration Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Integration Test Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(testResults).length === 0 ? (
            <p className="text-muted-foreground">No tests run yet. Click "Run Integration Tests" to begin.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(testResults).map(([test, passing]) => (
                <div key={test} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium capitalize">
                    {test.replace(/_/g, ' ')}
                  </span>
                  {getStatusIcon(passing)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Coverage Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 5 Integration Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Auth Context Integration</span>
              <Badge variant="outline">✅ Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Profile Context Flow</span>
              <Badge variant="outline">✅ Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Error Handling System</span>
              <Badge variant="outline">✅ Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Performance Monitoring</span>
              <Badge variant="outline">✅ Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Rate Limiting</span>
              <Badge variant="outline">✅ Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Lazy Component Loading</span>
              <Badge variant="outline">✅ Ready</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
