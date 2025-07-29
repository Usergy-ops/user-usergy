
-- 1. First, let's create the missing trigger on auth.users for automatic account type assignment
CREATE OR REPLACE FUNCTION public.handle_unified_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  -- Only process confirmed users (email confirmed or OAuth)
  IF NEW.email_confirmed_at IS NOT NULL OR 
     NEW.raw_app_meta_data->>'provider' IN ('google', 'github') THEN
    
    -- Assign account type based on email domain
    PERFORM public.assign_account_type_by_domain(NEW.id, NEW.email);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but never block user creation
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      context,
      user_id,
      metadata
    ) VALUES (
      'unified_signup_trigger_error',
      SQLERRM,
      'handle_unified_user_signup',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'error_detail', SQLERRM
      )
    );
    
    RETURN NEW;
END;
$$;

-- 2. Create the trigger on auth.users (this was missing!)
DROP TRIGGER IF EXISTS on_auth_user_created_unified ON auth.users;
CREATE TRIGGER on_auth_user_created_unified
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_unified_user_signup();

-- 3. Fix the existing user who doesn't have an account type
DO $$
DECLARE
  user_record record;
BEGIN
  -- Find the user without account type
  SELECT u.id, u.email INTO user_record
  FROM auth.users u
  LEFT JOIN public.account_types at ON u.id = at.auth_user_id
  WHERE u.email = 'vedaswaroopinjarapu@gmail.com'
    AND at.auth_user_id IS NULL;
  
  -- If user exists and has no account type, assign it
  IF user_record.id IS NOT NULL THEN
    PERFORM public.assign_account_type_by_domain(user_record.id, user_record.email);
    
    -- Log the fix
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      context,
      user_id,
      metadata
    ) VALUES (
      'info',
      'Fixed missing account type for existing user',
      'manual_account_type_fix',
      user_record.id,
      jsonb_build_object(
        'email', user_record.email,
        'method', 'domain_assignment'
      )
    );
  END IF;
END $$;

-- 4. Update the assign_account_type_by_domain function to handle user.usergy.ai domains
CREATE OR REPLACE FUNCTION public.assign_account_type_by_domain(user_id_param uuid, user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  account_type_to_assign text;
  full_name text;
  name_parts text[];
  first_name text := '';
  last_name text := '';
BEGIN
  -- Determine account type based on email domain with exact matching
  IF user_email LIKE '%@client.usergy.ai' THEN
    account_type_to_assign := 'client';
  ELSIF user_email LIKE '%@user.usergy.ai' THEN
    account_type_to_assign := 'user';
  ELSE
    -- Default to user for all other domains (including regular emails)
    account_type_to_assign := 'user';
  END IF;
  
  -- Insert account type (will not conflict due to unique constraint on auth_user_id)
  INSERT INTO public.account_types (auth_user_id, account_type)
  VALUES (user_id_param, account_type_to_assign)
  ON CONFLICT (auth_user_id) DO UPDATE SET
    account_type = EXCLUDED.account_type,
    created_at = COALESCE(account_types.created_at, NOW());
  
  -- If this is a regular user, ensure they have a profile
  IF account_type_to_assign = 'user' THEN
    -- Get user metadata for profile creation
    SELECT COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_id_param),
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = user_id_param),
      'User'
    ) INTO full_name;
    
    -- Parse name if available
    IF full_name != '' AND full_name != 'User' THEN
      name_parts := string_to_array(full_name, ' ');
      first_name := COALESCE(name_parts[1], '');
      last_name := COALESCE(array_to_string(name_parts[2:], ' '), '');
    END IF;
    
    -- Create profile for user workflow
    INSERT INTO public.profiles (
      user_id, 
      email, 
      full_name,
      completion_percentage
    )
    VALUES (
      user_id_param, 
      user_email,
      CASE WHEN full_name != 'User' THEN full_name ELSE NULL END,
      0
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  END IF;
  
  -- If this is a client, ensure they have a client profile
  IF account_type_to_assign = 'client' THEN
    -- Extract name from metadata
    SELECT COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_id_param),
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = user_id_param),
      ''
    ) INTO full_name;
    
    IF full_name != '' THEN
      name_parts := string_to_array(full_name, ' ');
      first_name := COALESCE(name_parts[1], '');
      last_name := COALESCE(array_to_string(name_parts[2:], ' '), '');
    END IF;
    
    -- Create client profile using the existing client schema
    PERFORM public.ensure_client_account_robust(
      user_id_param,
      'My Company',
      first_name,
      last_name
    );
  END IF;
  
  -- Log the assignment
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context,
    user_id,
    metadata
  ) VALUES (
    'info',
    'Account type assigned based on email domain',
    'assign_account_type_by_domain',
    user_id_param,
    jsonb_build_object(
      'email', user_email,
      'account_type', account_type_to_assign,
      'domain_detection', CASE 
        WHEN user_email LIKE '%@client.usergy.ai' THEN 'client_domain'
        WHEN user_email LIKE '%@user.usergy.ai' THEN 'user_domain'
        ELSE 'default_user_domain'
      END
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'account_type', account_type_to_assign,
    'message', 'Account type assigned successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      error_stack,
      context,
      user_id,
      metadata
    ) VALUES (
      'account_assignment_error',
      SQLERRM,
      SQLSTATE,
      'assign_account_type_by_domain',
      user_id_param,
      jsonb_build_object(
        'email', user_email,
        'error_detail', SQLERRM
      )
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 5. Create a function to validate account types before profile operations
CREATE OR REPLACE FUNCTION public.ensure_user_has_account_type(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  user_record record;
  account_type_exists boolean;
BEGIN
  -- Check if account type exists
  SELECT EXISTS(
    SELECT 1 FROM public.account_types 
    WHERE auth_user_id = user_id_param
  ) INTO account_type_exists;
  
  -- If account type doesn't exist, assign it
  IF NOT account_type_exists THEN
    -- Get user email
    SELECT id, email INTO user_record FROM auth.users WHERE id = user_id_param;
    
    IF user_record.id IS NOT NULL THEN
      -- Assign account type based on domain
      PERFORM public.assign_account_type_by_domain(user_record.id, user_record.email);
      
      -- Log the automatic assignment
      INSERT INTO public.error_logs (
        error_type,
        error_message,
        context,
        user_id,
        metadata
      ) VALUES (
        'info',
        'Account type automatically assigned during validation',
        'ensure_user_has_account_type',
        user_id_param,
        jsonb_build_object(
          'email', user_record.email,
          'trigger', 'profile_operation'
        )
      );
      
      RETURN TRUE;
    END IF;
    
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 6. Create monitoring function for account type issues
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
  result jsonb;
BEGIN
  -- Count total confirmed users
  SELECT COUNT(*) INTO total_users
  FROM auth.users
  WHERE email_confirmed_at IS NOT NULL;
  
  -- Count users with account types
  SELECT COUNT(*) INTO users_with_account_types
  FROM auth.users u
  JOIN public.account_types at ON u.id = at.auth_user_id
  WHERE u.email_confirmed_at IS NOT NULL;
  
  -- Calculate missing users
  users_without_account_types := total_users - users_with_account_types;
  
  -- Calculate coverage percentage
  coverage_percentage := CASE 
    WHEN total_users = 0 THEN 100.0
    ELSE ROUND((users_with_account_types::numeric / total_users::numeric) * 100, 2)
  END;
  
  result := jsonb_build_object(
    'total_users', total_users,
    'users_with_account_types', users_with_account_types,
    'users_without_account_types', users_without_account_types,
    'coverage_percentage', coverage_percentage,
    'is_healthy', users_without_account_types = 0,
    'timestamp', NOW()
  );
  
  -- Log monitoring result
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context,
    metadata
  ) VALUES (
    'monitoring',
    'Account type coverage monitoring',
    'monitor_account_type_coverage',
    result
  );
  
  RETURN result;
END;
$$;
