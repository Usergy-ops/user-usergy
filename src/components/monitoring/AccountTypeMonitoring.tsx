
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Users, UserCheck, UserX } from 'lucide-react';
import { monitorAccountTypeCoverage, fixExistingUsersWithoutAccountTypes } from '@/utils/accountTypeUtils';
import { useToast } from '@/hooks/use-toast';

interface AccountTypeStatus {
  total_users: number;
  users_with_account_types: number;
  users_without_account_types: number;
  coverage_percentage: number;
  is_healthy: boolean;
  timestamp: string;
}

export const AccountTypeMonitoring: React.FC = () => {
  const [status, setStatus] = useState<AccountTypeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await monitorAccountTypeCoverage();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching account type status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch account type monitoring data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fixMissingAccountTypes = async () => {
    try {
      setFixing(true);
      const result = await fixExistingUsersWithoutAccountTypes();
      
      if (result.success) {
        toast({
          title: "Fix Applied Successfully",
          description: `Processed ${result.users_processed} users, fixed ${result.users_fixed} accounts`
        });
        
        // Refresh status after fix
        await fetchStatus();
      } else {
        toast({
          title: "Fix Failed",
          description: result.error || "Failed to fix missing account types",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fixing account types:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fixing account types",
        variant: "destructive"
      });
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading Account Type Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Account Type Coverage
          {status?.is_healthy ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Healthy
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Issues Detected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Monitoring account type assignment for all users
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{status.total_users}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="w-4 h-4" />
                  Total Users
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{status.users_with_account_types}</div>
                <div className="text-sm text-green-600 flex items-center justify-center gap-1">
                  <UserCheck className="w-4 h-4" />
                  With Account Types
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{status.users_without_account_types}</div>
                <div className="text-sm text-red-600 flex items-center justify-center gap-1">
                  <UserX className="w-4 h-4" />
                  Missing Account Types
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{status.coverage_percentage}%</div>
                <div className="text-sm text-blue-600">Coverage</div>
              </div>
            </div>
            
            {!status.is_healthy && (
              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {status.users_without_account_types} users are missing account types
                  </span>
                </div>
                <Button
                  onClick={fixMissingAccountTypes}
                  disabled={fixing}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {fixing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    'Fix Missing Types'
                  )}
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(status.timestamp).toLocaleString()}
              </div>
              
              <Button
                onClick={fetchStatus}
                disabled={loading}
                variant="ghost"
                size="sm"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
