
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
