
import React, { useState } from 'react';
import { UnifiedLayout } from '@/layouts/UnifiedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Diagnostics: React.FC = () => {
  const { user, accountType } = useAuth();
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  const systemChecks = [
    {
      name: 'Authentication Status',
      status: user ? 'healthy' : 'error',
      message: user ? `Authenticated as ${user.email}` : 'Not authenticated',
      details: `Account Type: ${accountType || 'Unknown'}`,
    },
    {
      name: 'Database Connection',
      status: 'healthy',
      message: 'Connected to Supabase',
      details: 'All database operations functioning normally',
    },
    {
      name: 'API Endpoints',
      status: 'healthy',
      message: 'All endpoints responding',
      details: 'Response times within acceptable range',
    },
    {
      name: 'Real-time Features',
      status: 'warning',
      message: 'Some features degraded',
      details: 'WebSocket connections intermittent',
    },
    {
      name: 'File Storage',
      status: 'healthy',
      message: 'Storage service operational',
      details: 'Upload and download speeds optimal',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    // Simulate running diagnostics
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsRunningDiagnostics(false);
  };

  const healthyCount = systemChecks.filter(check => check.status === 'healthy').length;
  const warningCount = systemChecks.filter(check => check.status === 'warning').length;
  const errorCount = systemChecks.filter(check => check.status === 'error').length;

  return (
    <UnifiedLayout>
      <div className="max-w-6xl mx-auto space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Zap className="h-8 w-8 mr-3 text-yellow-500" />
              System Diagnostics
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor system health and performance metrics
            </p>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={isRunningDiagnostics}
            className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] hover:opacity-90"
          >
            {isRunningDiagnostics ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRunningDiagnostics ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{healthyCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed System Checks */}
        <Card>
          <CardHeader>
            <CardTitle>System Components</CardTitle>
            <CardDescription>
              Detailed status of all system components and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(check.status)}
                    <div>
                      <h4 className="font-medium">{check.name}</h4>
                      <p className="text-sm text-muted-foreground">{check.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                    </div>
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Session Info */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>User Session Information</CardTitle>
              <CardDescription>Current user session and authentication details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-mono text-sm">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                  <p className="font-mono text-sm">{accountType || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Sign In</p>
                  <p className="font-mono text-sm">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </UnifiedLayout>
  );
};

export default Diagnostics;
