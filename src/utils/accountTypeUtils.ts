
import { supabase } from '@/integrations/supabase/client';
import { monitoring } from './monitoring';

/**
 * Enhanced account type utilities - streamlined for cleaned database
 */

// Type definitions for RPC responses
interface CoverageStats {
  total_users: number;
  users_with_account_types: number;
  users_without_account_types: number;
  coverage_percentage: number;
  is_healthy: boolean;
  timestamp: string;
}

interface FixResult {
  success: boolean;
  users_analyzed: number;
  users_fixed: number;
  corrections?: any[];
  error?: string;
  message?: string;
}

interface AssignAccountTypeResult {
  success: boolean;
  account_type?: string;
  message?: string;
  error?: string;
}

export const ensureUserHasAccountType = async (userId: string): Promise<void> => {
  try {
    console.log('Ensuring user has account type:', userId);
    
    // Check if user already has an account type
    const { data: existingAccountType, error: fetchError } = await supabase
      .from('account_types')
      .select('account_type')
      .eq('auth_user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing account type:', fetchError);
      return;
    }

    if (existingAccountType) {
      console.log('User already has account type:', existingAccountType.account_type);
      return;
    }

    // Get user email for domain-based assignment
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user.user) {
      console.error('Error getting user for account type assignment:', userError);
      return;
    }

    // Use the manually assign function since assign_account_type_by_domain doesn't exist
    const { data: result, error: assignError } = await supabase
      .rpc('manually_assign_account_type', {
        user_id_param: userId,
        account_type_param: user.user.email?.includes('user.usergy.ai') ? 'user' : 'client'
      });

    if (assignError) {
      console.error('Error assigning account type:', assignError);
      return;
    }

    const assignResult = result as AssignAccountTypeResult;
    console.log('Account type assignment result:', assignResult);
    
    monitoring.recordMetric('account_type_assigned', 1, {
      account_type: assignResult?.account_type || 'unknown',
      user_id: userId
    });

  } catch (error) {
    console.error('Unexpected error in ensureUserHasAccountType:', error);
    monitoring.logError(error as Error, 'ensure_user_has_account_type', { userId });
  }
};

export const monitorAccountTypeCoverage = async (): Promise<CoverageStats> => {
  try {
    const { data, error } = await supabase.rpc('monitor_account_type_coverage');
    
    if (error) {
      throw error;
    }
    
    return data as CoverageStats;
  } catch (error) {
    console.error('Error monitoring account type coverage:', error);
    monitoring.logError(error as Error, 'monitor_account_type_coverage');
    throw error;
  }
};

export const fixExistingUsersWithoutAccountTypes = async (): Promise<FixResult> => {
  try {
    const { data, error } = await supabase.rpc('fix_account_type_mismatches');
    
    if (error) {
      throw error;
    }
    
    return data as FixResult;
  } catch (error) {
    console.error('Error fixing account type mismatches:', error);
    monitoring.logError(error as Error, 'fix_account_type_mismatches');
    throw error;
  }
};

/**
 * Manual account type assignment (admin function)
 */
export const manuallyAssignAccountType = async (
  userId: string, 
  accountType: 'user' | 'client'
): Promise<AssignAccountTypeResult> => {
  try {
    const { data, error } = await supabase.rpc('manually_assign_account_type', {
      user_id_param: userId,
      account_type_param: accountType
    });
    
    if (error) {
      throw error;
    }
    
    return data as AssignAccountTypeResult;
  } catch (error) {
    console.error('Error manually assigning account type:', error);
    monitoring.logError(error as Error, 'manual_account_type_assignment', { userId, accountType });
    throw error;
  }
};

// Export the function that was missing (alias for manuallyAssignAccountType)
export const assignAccountTypeByDomain = async (userId: string, email?: string): Promise<AssignAccountTypeResult> => {
  const accountType = email?.includes('user.usergy.ai') ? 'user' : 'client';
  return manuallyAssignAccountType(userId, accountType);
};
