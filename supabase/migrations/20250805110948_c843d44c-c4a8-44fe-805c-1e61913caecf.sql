
-- Phase 1: Database Trigger Cleanup & Fix
-- Step 1: Drop all existing conflicting triggers on auth.users table
DROP TRIGGER IF EXISTS assign_account_type_on_signup ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_account_type ON auth.users;
DROP TRIGGER IF EXISTS validate_password_trigger ON auth.users;
DROP TRIGGER IF EXISTS validate_password_on_signup_improved_trigger ON auth.users;

-- Step 2: Drop the old trigger functions that are causing issues
DROP FUNCTION IF EXISTS public.assign_account_type_on_signup();
DROP FUNCTION IF EXISTS public.on_auth_user_created_assign_account_type();
DROP FUNCTION IF EXISTS public.validate_password_on_signup_improved();

-- Step 3: Create a single, comprehensive trigger function that handles all requirements
CREATE OR REPLACE FUNCTION public.handle_auth_user_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  correct_type text := 'client'; -- Default fallback
  metadata_type text;
  signup_source text;
  source_url text;
  user_email text;
  is_oauth_user boolean := false;
  provider_name text;
BEGIN
  -- Get user email
  user_email := NEW.email;
  
  -- Detect OAuth users by checking for provider information
  -- OAuth users have provider metadata and different handling
  IF NEW.raw_app_meta_data IS NOT NULL THEN
    provider_name := NEW.raw_app_meta_data->>'provider';
    IF provider_name IS NOT NULL THEN
      is_oauth_user := true;
    END IF;
  END IF;
  
  -- Also check user metadata for provider info
  IF NOT is_oauth_user AND NEW.raw_user_meta_data IS NOT NULL THEN
    provider_name := NEW.raw_user_meta_data->>'provider';
    IF provider_name IS NOT NULL THEN
      is_oauth_user := true;
    END IF;
  END IF;
  
  -- Additional OAuth detection methods
  IF NOT is_oauth_user THEN
    -- Check if email is confirmed (OAuth users come pre-confirmed)
    IF NEW.email_confirmed_at IS NOT NULL AND NEW.created_at = NEW.email_confirmed_at THEN
      is_oauth_user := true;
    END IF;
    
    -- Check for specific OAuth patterns
    IF NEW.aud = 'authenticated' AND NEW.encrypted_password IS NULL THEN
      is_oauth_user := true;
    END IF;
  END IF;
  
  -- Password validation (ONLY for email/password signups, NOT OAuth)
  IF NOT is_oauth_user THEN
    -- Only validate for email/password signups
    -- Check if this is actually an email/password signup by looking for encrypted_password
    IF NEW.encrypted_password IS NOT NULL AND LENGTH(NEW.encrypted_password) > 0 THEN
      -- Basic validation for email/password users
      IF LENGTH(NEW.encrypted_password) < 10 THEN
        RAISE EXCEPTION 'Password does not meet security requirements' USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;
  
  -- Account type assignment logic
  -- Extract metadata values safely
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    metadata_type := NEW.raw_user_meta_data->>'account_type';
    signup_source := NEW.raw_user_meta_data->>'signup_source';
    source_url := NEW.raw_user_meta_data->>'source_url';
  END IF;
  
  -- Apply account type determination logic
  IF metadata_type IN ('user', 'client') THEN
    correct_type := metadata_type;
  ELSIF user_email LIKE '%@user.usergy.ai' OR user_email LIKE '%user.usergy.ai%' THEN
    correct_type := 'user';
  ELSIF user_email LIKE '%@client.usergy.ai' OR user_email LIKE '%client.usergy.ai%' THEN
    correct_type := 'client';
  ELSIF signup_source LIKE '%user%' THEN
    correct_type := 'user';
  ELSIF signup_source LIKE '%client%' THEN
    correct_type := 'client';
  ELSIF source_url LIKE '%user.usergy.ai%' THEN
    correct_type := 'user';
  END IF;
  
  -- Insert account type record
  INSERT INTO public.account_types (auth_user_id, account_type)
  VALUES (NEW.id, correct_type)
  ON CONFLICT (auth_user_id) DO UPDATE SET
    account_type = correct_type,
    created_at = CURRENT_TIMESTAMP;
  
  -- Create basic profile for the user
  PERFORM public.ensure_profile_exists(NEW.id, user_email, NEW.raw_user_meta_data->>'full_name');
  
  -- Log the assignment with OAuth detection info
  INSERT INTO public.error_logs (
    user_id,
    error_type,
    error_message,
    context,
    metadata
  ) VALUES (
    NEW.id,
    'account_creation_success',
    'User account created and configured successfully',
    'handle_auth_user_creation',
    jsonb_build_object(
      'account_type', correct_type,
      'email', user_email,
      'is_oauth_user', is_oauth_user,
      'provider', provider_name,
      'metadata_type', metadata_type,
      'signup_source', signup_source,
      'source_url', source_url,
      'email_confirmed', NEW.email_confirmed_at IS NOT NULL
    )
  );
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    INSERT INTO public.error_logs (
      user_id,
      error_type,
      error_message,
      context,
      metadata
    ) VALUES (
      NEW.id,
      'trigger_error',
      'Error in auth user creation trigger: ' || SQLERRM,
      'handle_auth_user_creation',
      jsonb_build_object(
        'error_detail', SQLERRM,
        'sqlstate', SQLSTATE,
        'email', user_email,
        'is_oauth_user', is_oauth_user,
        'provider', provider_name
      )
    );
    
    -- Return NEW to allow user creation to proceed
    RETURN NEW;
END;
$$;

-- Step 4: Create the single trigger that handles everything
CREATE TRIGGER handle_auth_user_creation_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_creation();

-- Step 5: Create a function to test OAuth user detection
CREATE OR REPLACE FUNCTION public.test_oauth_detection(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
  is_oauth boolean := false;
  provider_name text;
  detection_method text := 'none';
BEGIN
  SELECT * INTO user_record FROM auth.users WHERE id = user_id_param;
  
  IF user_record.id IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  -- Test OAuth detection logic
  IF user_record.raw_app_meta_data IS NOT NULL THEN
    provider_name := user_record.raw_app_meta_data->>'provider';
    IF provider_name IS NOT NULL THEN
      is_oauth := true;
      detection_method := 'app_metadata_provider';
    END IF;
  END IF;
  
  IF NOT is_oauth AND user_record.raw_user_meta_data IS NOT NULL THEN
    provider_name := user_record.raw_user_meta_data->>'provider';
    IF provider_name IS NOT NULL THEN
      is_oauth := true;
      detection_method := 'user_metadata_provider';
    END IF;
  END IF;
  
  IF NOT is_oauth THEN
    IF user_record.email_confirmed_at IS NOT NULL AND user_record.created_at = user_record.email_confirmed_at THEN
      is_oauth := true;
      detection_method := 'email_confirmed_timing';
    END IF;
  END IF;
  
  IF NOT is_oauth THEN
    IF user_record.aud = 'authenticated' AND user_record.encrypted_password IS NULL THEN
      is_oauth := true;
      detection_method := 'no_encrypted_password';
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'user_id', user_id_param,
    'email', user_record.email,
    'is_oauth_user', is_oauth,
    'provider', provider_name,
    'detection_method', detection_method,
    'email_confirmed_at', user_record.email_confirmed_at,
    'created_at', user_record.created_at,
    'has_encrypted_password', user_record.encrypted_password IS NOT NULL,
    'raw_app_meta_data', user_record.raw_app_meta_data,
    'raw_user_meta_data', user_record.raw_user_meta_data
  );
END;
$$;

-- Step 6: Create a comprehensive cleanup function for future maintenance
CREATE OR REPLACE FUNCTION public.comprehensive_auth_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_results jsonb := '{}';
  orphaned_accounts integer;
  missing_profiles integer;
BEGIN
  -- Clean up account types without corresponding auth users
  DELETE FROM public.account_types 
  WHERE auth_user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS orphaned_accounts = ROW_COUNT;
  
  -- Ensure all confirmed users have profiles
  INSERT INTO public.profiles (user_id, email, full_name, completion_percentage)
  SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', 'User'), 0
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id
  WHERE u.email_confirmed_at IS NOT NULL AND p.user_id IS NULL;
  GET DIAGNOSTICS missing_profiles = ROW_COUNT;
  
  -- Call existing cleanup functions
  PERFORM public.comprehensive_system_cleanup();
  
  cleanup_results := jsonb_build_object(
    'orphaned_accounts_cleaned', orphaned_accounts,
    'missing_profiles_created', missing_profiles,
    'timestamp', now(),
    'success', true
  );
  
  RETURN cleanup_results;
END;
$$;
