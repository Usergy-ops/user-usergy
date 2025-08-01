
import React from 'react';
import { useAccountType } from '@/hooks/useAccountType';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface AccountTypeGuardProps {
  children: React.ReactNode;
  allowedTypes: ('user' | 'client')[];
  fallback?: React.ReactNode;
  showDebugInfo?: boolean;
}

export const AccountTypeGuard: React.FC<AccountTypeGuardProps> = ({ 
  children, 
  allowedTypes, 
  fallback,
  showDebugInfo = false
}) => {
  const { accountType, loading, isUser, isClient, isUnknown } = useAccountType();
  
  // Show loading spinner while determining account type
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading account information...</p>
        </div>
      </div>
    );
  }
  
  // Debug information (for development)
  if (showDebugInfo) {
    console.log('AccountTypeGuard Debug:', {
      accountType,
      allowedTypes,
      isUser,
      isClient,
      isUnknown,
      loading
    });
  }
  
  // Check if user has allowed account type
  const hasAllowedType = accountType && allowedTypes.includes(accountType as any);
  
  if (!hasAllowedType) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center p-8 bg-card rounded-lg border max-w-md">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-full mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Access Restricted
          </h3>
          
          <p className="text-muted-foreground mb-4">
            This feature is not available for your account type.
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-muted-foreground">Current account:</span>
              <span className="font-medium capitalize">
                {accountType || 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-muted-foreground">Required:</span>
              <span className="font-medium capitalize">
                {allowedTypes.join(' or ')}
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center space-x-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Access control enforced</span>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};
