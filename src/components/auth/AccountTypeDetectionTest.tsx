
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ExternalLink, Users, Monitor, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { monitorAccountTypeCoverage, fixExistingUsersWithoutAccountTypes } from '@/utils/accountTypeUtils';
import { useAuth } from '@/contexts/AuthContext';

interface CoverageStats {
  total_users: number;
  users_with_account_types: number;
  users_without_account_types: number;
  coverage_percentage: number;
  is_healthy: boolean;
  timestamp: string;
}

export const AccountTypeDetectionTest: React.FC = () => {
  const { user, accountType } = useAuth();
  const [currentUrl, setCurrentUrl] = useState('');
  const [expectedType, setExpectedType] = useState<'user' | 'client' | 'unknown'>('unknown');
  const [coverageStats, setCoverageStats] = useState<CoverageStats | null>(null);
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(false);
  const [isFixingUsers, setIsFixingUsers] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  useEffect(() => {
    const url = window.location.href;
    setCurrentUrl(url);
    
    // Determine expected account type based on URL
    if (url.includes('user.usergy.ai')) {
      setExpectedType('user');
    } else if (url.includes('client.usergy.ai')) {
      setExpectedType('client');
    } else {
      setExpectedType('unknown');
    }
  }, []);

  const loadCoverageStats = async () => {
    setIsLoadingCoverage(true);
    try {
      const stats = await monitorAccountTypeCoverage();
      setCoverageStats(stats);
    } catch (error) {
      console.error('Error loading coverage stats:', error);
    } finally {
      setIsLoadingCoverage(false);
    }
  };

  const fixExistingUsers = async () => {
    setIsFixingUsers(true);
    setFixResult(null);
    try {
      const result = await fixExistingUsersWithoutAccountTypes();
      setFixResult(result);
      // Reload coverage stats after fixing
      if (result.success) {
        await loadCoverageStats();
      }
    } catch (error) {
      console.error('Error fixing users:', error);
      setFixResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsFixingUsers(false);
    }
  };

  useEffect(() => {
    loadCoverageStats();
  }, []);

  const getStatusColor = (actual: string | null, expected: string) => {
    if (!actual) return 'destructive';
    if (actual === expected) return 'default';
    return 'destructive';
  };

  const getStatusIcon = (actual: string | null, expected: string) => {
    if (!actual) return <AlertCircle className="h-4 w-4" />;
    if (actual === expected) return <CheckCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const isDetectionWorking = accountType === expectedType && expectedType !== 'unknown';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Type Detection Test</h2>
        <p className="text-muted-foreground">
          Testing domain-based account type assignment for user.usergy.ai and client.usergy.ai
        </p>
      </div>

      {/* Current Detection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Current Detection Status
          </CardTitle>
          <CardDescription>
            Real-time account type detection based on current domain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Current URL</p>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono text-muted-foreground">{currentUrl}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Expected Type</p>
              <Badge variant={expectedType === 'unknown' ? 'secondary' : 'default'}>
                {expectedType}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Detected Type</p>
              <div className="flex items-center gap-2">
                {getStatusIcon(accountType, expectedType)}
                <Badge variant={getStatusColor(accountType, expectedType)}>
                  {accountType || 'none'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {expectedType !== 'unknown' && (
            <Alert variant={isDetectionWorking ? 'default' : 'destructive'}>
              <AlertDescription>
                {isDetectionWorking ? (
                  <>
                    ✅ <strong>Detection Working:</strong> Account type correctly detected as "{accountType}" for {expectedType}.usergy.ai domain
                  </>
                ) : (
                  <>
                    ❌ <strong>Detection Failed:</strong> Expected "{expectedType}" but got "{accountType || 'none'}" for {expectedType}.usergy.ai domain
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {expectedType === 'unknown' && (
            <Alert>
              <AlertDescription>
                ℹ️ <strong>Neutral Domain:</strong> This domain is not configured for specific account type detection. 
                Visit user.usergy.ai or client.usergy.ai to test detection.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* System Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Coverage Analysis
          </CardTitle>
          <CardDescription>
            Overall health of account type assignment across all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {coverageStats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{coverageStats.total_users}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{coverageStats.users_with_account_types}</p>
                  <p className="text-sm text-muted-foreground">With Account Types</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{coverageStats.users_without_account_types}</p>
                  <p className="text-sm text-muted-foreground">Missing Account Types</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{coverageStats.coverage_percentage}%</p>
                  <p className="text-sm text-muted-foreground">Coverage</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {coverageStats.is_healthy ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    System Health: {coverageStats.is_healthy ? 'Healthy' : 'Needs Attention'}
                  </span>
                </div>
                <Button
                  onClick={loadCoverageStats}
                  disabled={isLoadingCoverage}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCoverage ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {coverageStats.users_without_account_types > 0 && (
                <div className="space-y-2">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {coverageStats.users_without_account_types} users are missing account type assignments. 
                      This may affect their access to the correct features.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={fixExistingUsers}
                    disabled={isFixingUsers}
                    variant="outline"
                  >
                    {isFixingUsers ? 'Fixing Users...' : 'Fix Missing Account Types'}
                  </Button>
                </div>
              )}

              {fixResult && (
                <Alert variant={fixResult.success ? 'default' : 'destructive'}>
                  <AlertDescription>
                    {fixResult.success ? (
                      <>✅ Successfully processed {fixResult.users_processed} users and fixed {fixResult.users_fixed} account types.</>
                    ) : (
                      <>❌ Error: {fixResult.error}</>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Loading coverage statistics...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Current User Info</CardTitle>
            <CardDescription>Debug information for the current authenticated user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Account Type:</strong> {accountType || 'Not assigned'}</div>
              <div><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</div>
              <div><strong>Last Sign In:</strong> {user.last_sign_in_at || 'Never'}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
