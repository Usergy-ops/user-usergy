
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountType } from '@/hooks/useAccountType';
import { AccountTypeStatusDisplay } from './AccountTypeStatusDisplay';
import { ensureUserHasAccountType } from '@/utils/accountTypeUtils';
import { useToast } from '@/hooks/use-toast';
import { 
  Bug, 
  RefreshCw, 
  User, 
  Mail, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

export const AuthDebugPanel: React.FC = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { accountType, loading: hookLoading } = useAccountType();
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleEnsureAccountType = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      await ensureUserHasAccountType(user.id);
      toast({
        title: "Account Type Ensured",
        description: "Account type verification completed successfully",
      });
      // Refresh the page to update the display
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Ensure Failed",
        description: "Failed to ensure account type",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const debugInfo = {
    user_id: user?.id || 'None',
    email: user?.email || 'None',
    session_active: !!session,
    account_type: accountType || 'Unknown',
    user_metadata: user?.user_metadata || {},
    auth_loading: authLoading,
    hook_loading: hookLoading,
    timestamp: new Date().toISOString()
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Bug className="w-4 h-4" />
            <span>Auth Debug Panel</span>
          </div>
          <Button
            onClick={() => setIsVisible(!isVisible)}
            variant="ghost"
            size="sm"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>

      {isVisible && (
        <CardContent className="space-y-4">
          {/* Account Type Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Account Type Status</h4>
            <AccountTypeStatusDisplay variant="detailed" showDetails />
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleEnsureAccountType}
                disabled={!user || isProcessing}
                variant="outline"
                size="sm"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Shield className="w-3 h-3 mr-1" />
                )}
                Ensure Account Type
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reload Page
              </Button>
            </div>
          </div>

          {/* Debug Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Debug Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {Object.entries(debugInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-1 px-2 bg-muted rounded">
                  <span className="font-mono text-muted-foreground">{key}:</span>
                  <Badge variant="outline" className="text-xs">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Status Alerts */}
          {!user && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No authenticated user found</AlertDescription>
            </Alert>
          )}

          {user && !accountType && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>User missing account type assignment</AlertDescription>
            </Alert>
          )}

          {user && accountType && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Authentication and account type properly configured</AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
};
