
import React from 'react';
import { useAccountType } from '@/hooks/useAccountType';
import { Loader2 } from 'lucide-react';

interface AccountTypeGuardProps {
  children: React.ReactNode;
  allowedTypes: ('user' | 'client')[];
  fallback?: React.ReactNode;
}

export const AccountTypeGuard: React.FC<AccountTypeGuardProps> = ({ 
  children, 
  allowedTypes, 
  fallback 
}) => {
  const { accountType, loading } = useAccountType();
  
  // Show loading spinner while determining account type
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check if user has allowed account type
  const hasAllowedType = accountType && allowedTypes.includes(accountType as any);
  
  if (!hasAllowedType) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center p-8 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Access Restricted
          </h3>
          <p className="text-muted-foreground mb-4">
            This feature is not available for your account type.
          </p>
          <p className="text-sm text-muted-foreground">
            Current account type: {accountType || 'Unknown'}
          </p>
          <p className="text-sm text-muted-foreground">
            Required: {allowedTypes.join(' or ')}
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};
