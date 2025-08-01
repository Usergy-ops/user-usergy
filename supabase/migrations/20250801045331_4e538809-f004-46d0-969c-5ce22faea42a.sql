
-- Phase 1: Clean up database triggers and create new source-based assignment function

-- First, drop all existing redundant triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_confirmed_client_signup ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_profile_creation ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_account_type_assignment ON auth.users;

-- Keep only the essential unified trigger
-- (This trigger should already exist, but we'll recreate it to be sure)
DROP TRIGGER IF EXISTS on_auth_user_unified_signup ON auth.users;

-- Create the new source-based account type assignment function
CREATE OR REPLACE FUNCTION public.assign_account_type_by_source(
  user_id_param uuid, 
  user_email text, 
  signup_source text DEFAULT NULL,
  account_type_override text DEFAULT NULL
)
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
  user_metadata jsonb;
  provider_name text;
BEGIN
  -- Get user metadata from auth.users table
  SELECT raw_user_meta_data, raw_app_meta_data->>'provider' 
  INTO user_metadata, provider_name 
  FROM auth.users 
  WHERE id = user_id_param;
  
  -- Log the assignment process
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context,
    user_id,
    metadata
  ) VALUES (
    'info',
    'Account type assignment by source initiated',
    'assign_account_type_by_source',
    user_id_param,
    jsonb_build_object(
      'email', user_email,
      'signup_source', signup_source,
      'account_type_override', account_type_override,
      'provider', provider_name,
      'raw_metadata', user_metadata
    )
  );
  
  -- PRIORITY 1: Check for explicit account type override
  IF account_type_override IS NOT NULL AND account_type_override IN ('user', 'client') THEN
    account_type_to_assign := account_type_override;
    
  -- PRIORITY 2: Check signup source
  ELSIF signup_source = 'user_signup' OR signup_source = 'enhanced_user_signup' THEN
    account_type_to_assign := 'user';
  ELSIF signup_source = 'client_signup' OR signup_source = 'enhanced_client_signup' THEN
    account_type_to_assign := 'client';
    
  -- PRIORITY 3: Check metadata for account type
  ELSIF user_metadata->>'account_type' = 'user' OR user_metadata->>'accountType' = 'user' THEN
    account_type_to_assign := 'user';
  ELSIF user_metadata->>'account_type' = 'client' OR user_metadata->>'accountType' = 'client' THEN
    account_type_to_assign := 'client';
    
  -- PRIORITY 4: Check referrer URL patterns
  ELSIF user_metadata->>'referrer_url' LIKE '%user.usergy.ai%' THEN
    account_type_to_assign := 'user';
  ELSIF user_metadata->>'referrer_url' LIKE '%client.usergy.ai%' THEN
    account_type_to_assign := 'client';
    
  -- PRIORITY 5: Default based on current deployment context
  -- Since this is currently client.usergy.ai deployment, default to client
  ELSE
    account_type_to_assign := 'client';
  END IF;
  
  -- Insert account type
  INSERT INTO public.account_types (auth_user_id, account_type)
  VALUES (user_id_param, account_type_to_assign)
  ON CONFLICT (auth_user_id) DO UPDATE SET
    account_type = EXCLUDED.account_type,
    created_at = COALESCE(account_types.created_at, NOW());
  
  -- If this is a user, ensure they have a profile
  IF account_type_to_assign = 'user' THEN
    -- Get user metadata for profile creation
    SELECT COALESCE(
      user_metadata->>'full_name',
      user_metadata->>'name',
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
      user_metadata->>'full_name',
      user_metadata->>'name',
      user_metadata->>'given_name' || ' ' || user_metadata->>'family_name',
      ''
    ) INTO full_name;
    
    IF full_name != '' THEN
      name_parts := string_to_array(full_name, ' ');
      first_name := COALESCE(name_parts[1], '');
      last_name := COALESCE(array_to_string(name_parts[2:], ' '), '');
    END IF;
    
    -- Use metadata values if available, otherwise use extracted names
    first_name := COALESCE(
      user_metadata->>'contactFirstName',
      user_metadata->>'first_name',
      user_metadata->>'given_name',
      first_name,
      ''
    );
    
    last_name := COALESCE(
      user_metadata->>'contactLastName',
      user_metadata->>'last_name',
      user_metadata->>'family_name',
      last_name,
      ''
    );
    
    -- Create client profile
    PERFORM public.ensure_client_account_robust(
      user_id_param,
      COALESCE(user_metadata->>'companyName', user_metadata->>'company_name', 'My Company'),
      first_name,
      last_name
    );
  END IF;
  
  -- Log successful assignment
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context,
    user_id,
    metadata
  ) VALUES (
    'info',
    'Account type assignment by source completed successfully',
    'assign_account_type_by_source',
    user_id_param,
    jsonb_build_object(
      'email', user_email,
      'final_account_type', account_type_to_assign,
      'provider', provider_name,
      'signup_source', signup_source,
      'account_type_override', account_type_override,
      'assignment_method', CASE 
        WHEN account_type_override IS NOT NULL THEN 'explicit_override'
        WHEN signup_source IN ('user_signup', 'enhanced_user_signup') THEN 'user_signup_source'
        WHEN signup_source IN ('client_signup', 'enhanced_client_signup') THEN 'client_signup_source'
        WHEN user_metadata->>'account_type' = 'user' OR user_metadata->>'accountType' = 'user' THEN 'user_metadata'
        WHEN user_metadata->>'account_type' = 'client' OR user_metadata->>'accountType' = 'client' THEN 'client_metadata'
        WHEN user_metadata->>'referrer_url' LIKE '%user.usergy.ai%' THEN 'user_referrer'
        WHEN user_metadata->>'referrer_url' LIKE '%client.usergy.ai%' THEN 'client_referrer'
        ELSE 'client_default'
      END
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'account_type', account_type_to_assign,
    'assignment_method', CASE 
      WHEN account_type_override IS NOT NULL THEN 'explicit_override'
      WHEN signup_source IN ('user_signup', 'enhanced_user_signup') THEN 'user_signup_source'
      WHEN signup_source IN ('client_signup', 'enhanced_client_signup') THEN 'client_signup_source'
      WHEN user_metadata->>'account_type' = 'user' OR user_metadata->>'accountType' = 'user' THEN 'user_metadata'
      WHEN user_metadata->>'account_type' = 'client' OR user_metadata->>'accountType' = 'client' THEN 'client_metadata'
      WHEN user_metadata->>'referrer_url' LIKE '%user.usergy.ai%' THEN 'user_referrer'
      WHEN user_metadata->>'referrer_url' LIKE '%client.usergy.ai%' THEN 'client_referrer'
      ELSE 'client_default'
    END,
    'message', 'Account type assigned successfully using source-based logic'
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
      'assign_account_type_by_source',
      user_id_param,
      jsonb_build_object(
        'email', user_email,
        'signup_source', signup_source,
        'account_type_override', account_type_override,
        'error_detail', SQLERRM,
        'user_metadata', user_metadata,
        'provider', provider_name
      )
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create a simplified unified trigger that uses the new function
CREATE OR REPLACE FUNCTION public.handle_unified_signup_with_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Only process confirmed users (email confirmed or OAuth)
  IF NEW.email_confirmed_at IS NOT NULL OR 
     NEW.raw_app_meta_data->>'provider' IN ('google', 'github') THEN
    
    -- Use the new source-based assignment function
    PERFORM public.assign_account_type_by_source(
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data->>'signup_source',
      NEW.raw_user_meta_data->>'account_type'
    );
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
      'handle_unified_signup_with_source',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'error_detail', SQLERRM
      )
    );
    
    RETURN NEW;
END;
$function$;

-- Create the unified trigger
CREATE TRIGGER on_auth_user_unified_signup_with_source
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_unified_signup_with_source();
