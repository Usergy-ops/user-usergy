
import { useAuth } from '@/contexts/AuthContext';

export const useAccountType = () => {
  const { accountType, loading, user } = useAuth();
  
  const isUser = accountType === 'user';
  const isClient = accountType === 'client';
  const isUnknown = !accountType || accountType === 'unknown';
  
  // Enhanced logging for debugging redirect issues
  console.log('useAccountType hook state (enhanced for redirect debugging):', {
    user_id: user?.id,
    user_email: user?.email,
    user_metadata_account_type: user?.user_metadata?.account_type,
    stored_accountType: accountType,
    isUser,
    isClient,
    isUnknown,
    loading,
    current_domain: window.location.hostname,
    redirect_context: 'account_type_determination'
  });
  
  return {
    accountType,
    isUser,
    isClient,
    isUnknown,
    loading
  };
};
