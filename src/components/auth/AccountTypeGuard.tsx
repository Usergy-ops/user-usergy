
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  if (!accountType || !allowedTypes.includes(accountType as any)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Access Restricted
          </h3>
          <p className="text-muted-foreground">
            This feature is not available for your account type.
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};
