
import { supabase } from '@/integrations/supabase/client';

export const getUserAccountType = async (userId?: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_account_type', {
      user_id_param: userId || undefined
    });

    if (error) {
      console.error('Error getting account type:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getUserAccountType:', error);
    return null;
  }
};

export const checkIsUserAccount = async (userId?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_user_account', {
      user_id_param: userId || undefined
    });

    if (error) {
      console.error('Error checking user account:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in checkIsUserAccount:', error);
    return false;
  }
};

export const checkIsClientAccount = async (userId?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_client_account', {
      user_id_param: userId || undefined
    });

    if (error) {
      console.error('Error checking client account:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in checkIsClientAccount:', error);
    return false;
  }
};

export const ensureUserHasAccountType = async (userId?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('ensure_user_has_account_type', {
      user_id_param: userId || undefined
    });

    if (error) {
      console.error('Error ensuring account type:', error);
      return false;
    }

    return data || false;
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
    const { data, error } = await supabase.rpc('fix_existing_users_without_account_types');

    if (error) {
      console.error('Error fixing existing users:', error);
      return {
        success: false,
        users_processed: 0,
        users_fixed: 0,
        error: error.message
      };
    }

    // Type guard to ensure data matches our expected structure
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const result = data as {
        success?: boolean;
        users_processed?: number;
        users_fixed?: number;
        message?: string;
        error?: string;
      };

      return {
        success: result.success ?? false,
        users_processed: result.users_processed ?? 0,
        users_fixed: result.users_fixed ?? 0,
        message: result.message,
        error: result.error
      };
    }

    // Fallback if data doesn't match expected structure
    return {
      success: false,
      users_processed: 0,
      users_fixed: 0,
      error: 'Invalid response format from database function'
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
    const { data, error } = await supabase.rpc('assign_account_type_by_domain', {
      user_id_param: userId,
      user_email: email
    });

    if (error) {
      console.error('Error assigning account type by domain:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Type guard to ensure data matches our expected structure
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const result = data as {
        success?: boolean;
        account_type?: string;
        message?: string;
        error?: string;
      };

      return {
        success: result.success ?? false,
        account_type: result.account_type,
        message: result.message,
        error: result.error
      };
    }

    // Fallback if data doesn't match expected structure
    return {
      success: false,
      error: 'Invalid response format from database function'
    };
  } catch (error) {
    console.error('Error in assignAccountTypeByDomain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
