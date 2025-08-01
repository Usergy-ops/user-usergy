
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountType } from '@/hooks/useAccountType';
import { monitorAccountTypeCoverage, fixExistingUsersWithoutAccountTypes, ensureUserHasAccountType } from '@/utils/accountTypeUtils';
import { RefreshCw, Users, CheckCircle, AlertTriangle, Shield, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AuthTestingUtility: React.FC = () => {
  const { user, session, accountType: contextAccountType, loading: authLoading } = useAuth();
  const { accountType, isUser, isClient, isUnknown, loading: hookLoading } = useAccountType();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isEnsuring, setIsEnsuring] = useState(false);
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [fixingData, setFixingData] = useState<any>(null);
  const { toast } = useToast();

  const handleMonitorCoverage = async () => {
    setIsMonitoring(true);
    try {
      const data = await monitorAccountTypeCoverage();
      setMonitoringData(data);
      
      if (data.is_healthy) {
        toast({
          title: "Account Type Coverage",
          description: `${data.coverage_percentage}% coverage - System healthy!`,
        });
      } else {
        toast({
          title: "Account Type Issues Found",
          description: `${data.users_without_account_types} users need account type assignment`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Monitoring Error",
        description: "Failed to check account type coverage",
        variant: "destructive"
      });
    } finally {
      setIsMonitoring(false);
    }
  };

  const handleFixAccountTypes = async () => {
    setIsFixing(true);
    try {
      const data = await fixExistingUsersWithoutAccountTypes();
      setFixingData(data);
      
      if (data.success) {
        toast({
          title: "Account Types Fixed",
          description: `Fixed ${data.users_fixed} out of ${data.users_analyzed} users`,
        });
      } else {
        toast({
          title: "Fix Failed",
          description: data.error || "Failed to fix account types",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fix Error",
        description: "Failed to fix account type issues",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleEnsureCurrentUser = async () => {
    if (!user) {
      toast({
        title: "No User",
        description: "Please sign in first",
        variant: "destructive"
      });
      return;
    }

    setIsEnsuring(true);
    try {
      await ensureUserHasAccountType(user.id);
      toast({
        title: "Account Type Ensured",
        description: "Account type has been verified for current user",
      });
      // Refresh the page to update account type display
      window.location.reload();
    } catch (error) {
      toast({
        title: "Ensure Error",
        description: "Failed to ensure account type",
        variant: "destructive"
      });
    } finally {
      setIsEnsuring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Authentication System Status</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current User Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Current User</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <Badge variant="outline">{user?.id || 'None'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <Badge variant="outline">{user?.email || 'None'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Session:</span>
                  <Badge variant={session ? 'default' : 'destructive'}>
                    {session ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Account Type Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Context Type:</span>
                  <Badge variant={contextAccountType ? 'default' : 'destructive'}>
                    {contextAccountType || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Hook Type:</span>
                  <Badge variant={accountType ? 'default' : 'destructive'}>
                    {accountType || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <Badge variant={authLoading || hookLoading ? 'secondary' : 'outline'}>
                    {authLoading || hookLoading ? 'Loading...' : 'Ready'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Account Type Flags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={isUser ? 'default' : 'outline'}>
              User Account: {isUser ? 'Yes' : 'No'}
            </Badge>
            <Badge variant={isClient ? 'default' : 'outline'}>
              Client Account: {isClient ? 'Yes' : 'No'}
            </Badge>
            <Badge variant={isUnknown ? 'destructive' : 'outline'}>
              Unknown Type: {isUnknown ? 'Yes' : 'No'}
            </Badge>
          </div>

          {/* System Actions */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleMonitorCoverage}
                disabled={isMonitoring}
                variant="outline"
              >
                {isMonitoring ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Users className="w-4 h-4 mr-2" />
                )}
                Monitor Coverage
              </Button>

              <Button
                onClick={handleFixAccountTypes}
                disabled={isFixing}
                variant="outline"
              >
                {isFixing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Fix Account Types
              </Button>

              <Button
                onClick={handleEnsureCurrentUser}
                disabled={isEnsuring || !user}
                variant="outline"
              >
                {isEnsuring ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Ensure Current User
              </Button>
            </div>

            {/* Results Display */}
            {monitoringData && (
              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2 flex items-center space-x-2">
                  {monitoringData.is_healthy ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span>Coverage Report</span>
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>Total Users: <Badge>{monitoringData.total_users}</Badge></div>
                  <div>With Types: <Badge>{monitoringData.users_with_account_types}</Badge></div>
                  <div>Without Types: <Badge variant="destructive">{monitoringData.users_without_account_types}</Badge></div>
                  <div>Coverage: <Badge>{monitoringData.coverage_percentage}%</Badge></div>
                </div>
              </div>
            )}

            {fixingData && (
              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2 flex items-center space-x-2">
                  {fixingData.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span>Fix Report</span>
                </h5>
                <div className="space-y-2 text-sm">
                  <div>Analyzed: <Badge>{fixingData.users_analyzed}</Badge></div>
                  <div>Fixed: <Badge variant="default">{fixingData.users_fixed}</Badge></div>
                  <div className="text-xs text-muted-foreground">{fixingData.message}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
