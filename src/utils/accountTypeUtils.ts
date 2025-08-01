
import { supabase } from '@/integrations/supabase/client';

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
      return null;
    }

    return data?.account_type || null;
  } catch (error) {
    console.error('Error in getUserAccountType:', error);
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
      return true;
    }

    // Get user email to determine account type
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email) {
      console.error('Error getting user email:', userError);
      return false;
    }

    // Determine account type based on email domain
    let accountType = 'client'; // default
    if (userData.user.email.includes('@user.usergy.ai')) {
      accountType = 'user';
    }

    // Insert account type
    const { error: insertError } = await supabase
      .from('account_types')
      .insert({
        auth_user_id: userIdToUse,
        account_type: accountType
      });

    if (insertError) {
      console.error('Error inserting account type:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in ensureUserHasAccountType:', error);
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
    // This function would need to be implemented if the database function exists
    // For now, return a placeholder response
    console.warn('fixExistingUsersWithoutAccountTypes not implemented - database function missing');
    return {
      success: false,
      users_processed: 0,
      users_fixed: 0,
      error: 'Function not available - database function missing'
    };
  } catch (error) {
    console.error('Error in fixExistingUsersWithoutAccountTypes:', error);
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
    // Determine account type based on email domain
    let accountType = 'client'; // default
    if (email.includes('@user.usergy.ai')) {
      accountType = 'user';
    }

    // Insert or update account type
    const { error } = await supabase
      .from('account_types')
      .upsert({
        auth_user_id: userId,
        account_type: accountType
      });

    if (error) {
      console.error('Error assigning account type by domain:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      account_type: accountType,
      message: `Account type '${accountType}' assigned successfully`
    };
  } catch (error) {
    console.error('Error in assignAccountTypeByDomain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
