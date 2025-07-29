
import { useAuth } from '@/contexts/AuthContext';

export const useAccountType = () => {
  const { accountType, loading, refreshAccountType } = useAuth();
  
  const isUser = accountType === 'user';
  const isClient = accountType === 'client';
  const isUnknown = !accountType || accountType === 'unknown';
  
  return {
    accountType,
    isUser,
    isClient,
    isUnknown,
    loading,
    refreshAccountType
  };
};
