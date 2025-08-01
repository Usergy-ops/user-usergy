
-- Phase 2: Clean up database triggers
-- First, let's see what triggers currently exist and remove redundant ones

-- Drop redundant triggers that might be conflicting
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS assign_account_type_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_client_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_unified_signup_trigger ON auth.users;

-- Keep only the most effective trigger for account type assignment
-- This trigger will handle all confirmed users (email confirmed or OAuth)
CREATE OR REPLACE TRIGGER handle_account_type_assignment_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_unified_signup_with_source();

-- Ensure the trigger function is optimized and uses the latest assign_account_type_by_domain function
CREATE OR REPLACE FUNCTION public.handle_unified_signup_with_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  -- Only process confirmed users (email confirmed or OAuth)
  -- Also handle the case where email confirmation happens after initial insert
  IF (TG_OP = 'INSERT' AND (NEW.email_confirmed_at IS NOT NULL OR NEW.raw_app_meta_data->>'provider' IN ('google', 'github'))) OR
     (TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    
    -- Log the trigger execution with detailed context
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      context,
      user_id,
      metadata
    ) VALUES (
      'info',
      'Account type assignment trigger executed',
      'handle_unified_signup_with_source',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'trigger_operation', TG_OP,
        'provider', NEW.raw_app_meta_data->>'provider',
        'signup_source', NEW.raw_user_meta_data->>'signup_source',
        'account_type_metadata', NEW.raw_user_meta_data->>'account_type',
        'referrer_url', NEW.raw_user_meta_data->>'referrer_url'
      )
    );
    
    -- Use the enhanced assign_account_type_by_domain function
    PERFORM public.assign_account_type_by_domain(
      NEW.id, 
      NEW.email
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Enhanced error logging but never block user creation
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      error_stack,
      context,
      user_id,
      metadata
    ) VALUES (
      'trigger_error',
      SQLERRM,
      SQLSTATE,
      'handle_unified_signup_with_source',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'trigger_operation', TG_OP,
        'error_detail', SQLERRM,
        'sql_state', SQLSTATE,
        'provider', NEW.raw_app_meta_data->>'provider',
        'signup_source', NEW.raw_user_meta_data->>'signup_source'
      )
    );
    
    RETURN NEW;
END;
$$;

-- Add a monitoring function to track account type assignment coverage
CREATE OR REPLACE FUNCTION public.monitor_account_type_coverage()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  total_users integer;
  users_with_account_types integer;
  users_without_account_types integer;
  coverage_percentage numeric;
BEGIN
  -- Count total confirmed users
  SELECT COUNT(*) INTO total_users
  FROM auth.users
  WHERE email_confirmed_at IS NOT NULL;
  
  -- Count users with account types
  SELECT COUNT(*) INTO users_with_account_types
  FROM auth.users u
  INNER JOIN public.account_types at ON u.id = at.auth_user_id
  WHERE u.email_confirmed_at IS NOT NULL;
  
  -- Calculate users without account types
  users_without_account_types := total_users - users_with_account_types;
  
  -- Calculate coverage percentage
  IF total_users > 0 THEN
    coverage_percentage := (users_with_account_types::numeric / total_users::numeric) * 100;
  ELSE
    coverage_percentage := 100;
  END IF;
  
  RETURN jsonb_build_object(
    'total_users', total_users,
    'users_with_account_types', users_with_account_types,
    'users_without_account_types', users_without_account_types,
    'coverage_percentage', ROUND(coverage_percentage, 2),
    'is_healthy', coverage_percentage >= 95,
    'timestamp', NOW()
  );
END;
$$;
