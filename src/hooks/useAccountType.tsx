
import { useAuth } from '@/contexts/AuthContext';

export const useAccountType = () => {
  const { accountType, loading, user } = useAuth();
  
  const isUser = accountType === 'user';
  const isClient = accountType === 'client';
  const isUnknown = !accountType || accountType === 'unknown';
  
  // Enhanced logging for debugging
  console.log('useAccountType hook state:', {
    user_id: user?.id,
    accountType,
    isUser,
    isClient,
    isUnknown,
    loading
  });
  
  return {
    accountType,
    isUser,
    isClient,
    isUnknown,
    loading
  };
};
