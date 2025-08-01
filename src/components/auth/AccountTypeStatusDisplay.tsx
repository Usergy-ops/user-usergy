
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountType } from '@/hooks/useAccountType';
import { CheckCircle, AlertTriangle, Loader2, User, Building2 } from 'lucide-react';

interface AccountTypeStatusDisplayProps {
  showDetails?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export const AccountTypeStatusDisplay: React.FC<AccountTypeStatusDisplayProps> = ({
  showDetails = false,
  variant = 'default'
}) => {
  const { user, loading: authLoading } = useAuth();
  const { accountType, isUser, isClient, isUnknown, loading: hookLoading } = useAccountType();

  const loading = authLoading || hookLoading;

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading account type...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No user session found</AlertDescription>
      </Alert>
    );
  }

  if (variant === 'compact') {
    return (
      <Badge variant={isUnknown ? 'destructive' : 'default'}>
        {isUser && <User className="w-3 h-3 mr-1" />}
        {isClient && <Building2 className="w-3 h-3 mr-1" />}
        {accountType || 'Unknown'}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Account Type Status</span>
          {!isUnknown ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Type:</span>
            <Badge variant={isUnknown ? 'destructive' : 'default'}>
              {accountType || 'Unknown'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Role:</span>
            <span className="text-muted-foreground">
              {isUser && 'Team Member'}
              {isClient && 'Client Account'}
              {isUnknown && 'Not Set'}
            </span>
          </div>
        </div>

        {showDetails && (
          <div className="text-xs text-muted-foreground">
            <div>User ID: {user.id}</div>
            <div>Email: {user.email}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {isUser && <User className="w-4 h-4 text-blue-600" />}
        {isClient && <Building2 className="w-4 h-4 text-green-600" />}
        {isUnknown && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
        
        <Badge variant={isUnknown ? 'destructive' : 'default'}>
          {accountType || 'Unknown'}
        </Badge>
      </div>

      {showDetails && (
        <div className="text-sm text-muted-foreground">
          {isUser && '(Usergy Team Member)'}
          {isClient && '(Client Account)'}
          {isUnknown && '(Requires Assignment)'}
        </div>
      )}
    </div>
  );
};
