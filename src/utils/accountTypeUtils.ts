import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';

export const getUserAccountType = async (userId?: string): Promise<string | null> => {
  try {
    const userIdToUse = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!userIdToUse) {
      console.warn('No user ID provided for account type lookup');
      return null;
    }

    const { data, error } = await supabase
      .from('account_types')
      .select('account_type')
      .eq('auth_user_id', userIdToUse)
      .single();

    if (error) {
      console.error('Error getting account type:', error);
      monitoring.logError(error, 'get_user_account_type_error', { userId: userIdToUse });
      return null;
    }

    return data?.account_type || null;
  } catch (error) {
    console.error('Error in getUserAccountType:', error);
    monitoring.logError(error as Error, 'get_user_account_type_error', { userId });
    return null;
  }
};

export const checkIsUserAccount = async (userId?: string): Promise<boolean> => {
  try {
    const accountType = await getUserAccountType(userId);
    return accountType === 'user';
  } catch (error) {
    console.error('Error in checkIsUserAccount:', error);
    return false;
  }
};

export const checkIsClientAccount = async (userId?: string): Promise<boolean> => {
  try {
    const accountType = await getUserAccountType(userId);
    return accountType === 'client';
  } catch (error) {
    console.error('Error in checkIsClientAccount:', error);
    return false;
  }
};

export const ensureUserHasAccountType = async (userId?: string): Promise<boolean> => {
  try {
    const userIdToUse = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!userIdToUse) {
      console.warn('No user ID provided for account type assignment');
      return false;
    }

    // Check if user already has an account type
    const existingAccountType = await getUserAccountType(userIdToUse);
    if (existingAccountType) {
      console.log('User already has account type:', existingAccountType);
      return true;
    }

    // Get user data to determine account type
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email) {
      console.error('Error getting user data:', userError);
      return false;
    }

    // Enhanced account type detection logic
    let accountType = 'client'; // Default fallback
    
    // Priority 1: Check user metadata first (most reliable for OTP users)
    const metadataAccountType = userData.user.user_metadata?.account_type;
    if (metadataAccountType && ['user', 'client'].includes(metadataAccountType)) {
      accountType = metadataAccountType;
      console.log('Account type determined from user metadata:', accountType);
    }
    // Priority 2: Domain-based detection as fallback
    else if (userData.user.email.includes('@user.usergy.ai') || userData.user.email.includes('user.usergy.ai')) {
      accountType = 'user';
      console.log('Account type determined from user domain:', accountType);
    } else if (userData.user.email.includes('@client.usergy.ai') || userData.user.email.includes('client.usergy.ai')) {
      accountType = 'client';
      console.log('Account type determined from client domain:', accountType);
    }
    // Priority 3: Check signup source from metadata
    else if (userData.user.user_metadata?.signup_source?.includes('user')) {
      accountType = 'user';
      console.log('Account type determined from signup source:', accountType);
    }

    // Insert the determined account type
    const { error: insertError } = await supabase
      .from('account_types')
      .insert({
        auth_user_id: userIdToUse,
        account_type: accountType
      });

    if (insertError) {
      console.error('Error inserting account type:', insertError);
      monitoring.logError(insertError, 'ensure_user_has_account_type_error', { 
        userId: userIdToUse, 
        email: userData.user.email,
        determinedAccountType: accountType
      });
      return false;
    }

    console.log(`Account type ${accountType} successfully assigned to user ${userIdToUse}`);
    return true;
  } catch (error) {
    console.error('Error in ensureUserHasAccountType:', error);
    monitoring.logError(error as Error, 'ensure_user_has_account_type_error', { userId });
    return false;
  }
};

export const monitorAccountTypeCoverage = async (): Promise<{
  total_users: number;
  users_with_account_types: number;
  users_without_account_types: number;
  coverage_percentage: number;
  is_healthy: boolean;
  timestamp: string;
}> => {
  try {
    const { data, error } = await supabase.rpc('monitor_account_type_coverage');

    if (error) {
      console.error('Error monitoring account type coverage:', error);
      monitoring.logError(error, 'monitor_account_type_coverage_error');
      return {
        total_users: 0,
        users_with_account_types: 0,
        users_without_account_types: 0,
        coverage_percentage: 0,
        is_healthy: false,
        timestamp: new Date().toISOString()
      };
    }

    // Type guard to ensure data matches our expected structure
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const result = data as {
        total_users?: number;
        users_with_account_types?: number;
        users_without_account_types?: number;
        coverage_percentage?: number;
        is_healthy?: boolean;
        timestamp?: string;
      };

      return {
        total_users: result.total_users ?? 0,
        users_with_account_types: result.users_with_account_types ?? 0,
        users_without_account_types: result.users_without_account_types ?? 0,
        coverage_percentage: result.coverage_percentage ?? 0,
        is_healthy: result.is_healthy ?? false,
        timestamp: result.timestamp ?? new Date().toISOString()
      };
    }

    // Fallback if data doesn't match expected structure
    return {
      total_users: 0,
      users_with_account_types: 0,
      users_without_account_types: 0,
      coverage_percentage: 0,
      is_healthy: false,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in monitorAccountTypeCoverage:', error);
    monitoring.logError(error as Error, 'monitor_account_type_coverage_error');
    return {
      total_users: 0,
      users_with_account_types: 0,
      users_without_account_types: 0,
      coverage_percentage: 0,
      is_healthy: false,
      timestamp: new Date().toISOString()
    };
  }
};

export const fixExistingUsersWithoutAccountTypes = async (): Promise<{
  success: boolean;
  users_processed: number;
  users_fixed: number;
  message?: string;
  error?: string;
}> => {
  try {
    // Call the database function to fix account type mismatches
    const { data, error } = await supabase.rpc('fix_account_type_mismatches');

    if (error) {
      console.error('Error fixing account type mismatches:', error);
      monitoring.logError(error, 'fix_account_type_mismatches_error');
      return {
        success: false,
        users_processed: 0,
        users_fixed: 0,
        error: error.message
      };
    }

    // Type guard for the RPC response
    const result = data as { 
      success?: boolean; 
      users_analyzed?: number; 
      users_fixed?: number; 
      message?: string 
    } | null;

    return {
      success: result?.success || false,
      users_processed: result?.users_analyzed || 0,
      users_fixed: result?.users_fixed || 0,
      message: result?.message || 'Account type fix completed'
    };
  } catch (error) {
    console.error('Error in fixExistingUsersWithoutAccountTypes:', error);
    monitoring.logError(error as Error, 'fix_account_type_mismatches_error');
    return {
      success: false,
      users_processed: 0,
      users_fixed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const assignAccountTypeByDomain = async (userId: string, email: string): Promise<{
  success: boolean;
  account_type?: string;
  message?: string;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.rpc('assign_account_type_by_domain', {
      user_id_param: userId,
      email_param: email
    });

    if (error) {
      console.error('Error assigning account type by domain:', error);
      monitoring.logError(error, 'assign_account_type_by_domain_error', { userId, email });
      return {
        success: false,
        error: error.message
      };
    }

    // Type guard for the RPC response
    const result = data as { 
      success?: boolean; 
      account_type?: string; 
      message?: string 
    } | null;

    return {
      success: result?.success || false,
      account_type: result?.account_type,
      message: result?.message || 'Account type assigned successfully'
    };
  } catch (error) {
    console.error('Error in assignAccountTypeByDomain:', error);
    monitoring.logError(error as Error, 'assign_account_type_by_domain_error', { userId, email });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
