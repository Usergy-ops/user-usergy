
-- Update the assign_account_type_by_domain function to fix account type assignment logic
CREATE OR REPLACE FUNCTION public.assign_account_type_by_domain(user_id_param uuid, user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  account_type_to_assign text;
  full_name text;
  name_parts text[];
  first_name text := '';
  last_name text := '';
  user_metadata jsonb;
  signup_source text;
  metadata_account_type text;
  referrer_url text;
  provider_name text;
BEGIN
  -- Get user metadata from auth.users table
  SELECT raw_user_meta_data, raw_app_meta_data->>'provider' 
  INTO user_metadata, provider_name 
  FROM auth.users 
  WHERE id = user_id_param;
  
  -- Extract relevant metadata fields
  signup_source := user_metadata->>'signup_source';
  metadata_account_type := COALESCE(
    user_metadata->>'account_type',
    user_metadata->>'accountType'
  );
  referrer_url := user_metadata->>'referrer_url';
  
  -- Log the metadata analysis
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context,
    user_id,
    metadata
  ) VALUES (
    'info',
    'Account type assignment - analyzing signup source and referrer URL',
    'assign_account_type_by_domain',
    user_id_param,
    jsonb_build_object(
      'email', user_email,
      'signup_source', signup_source,
      'metadata_account_type', metadata_account_type,
      'referrer_url', referrer_url,
      'provider', provider_name,
      'raw_metadata', user_metadata
    )
  );
  
  -- PRIORITY 1: Check for explicit account type designation from metadata
  IF metadata_account_type = 'user' OR signup_source = 'user_signup' THEN
    account_type_to_assign := 'user';
    
  -- PRIORITY 2: Check for explicit client designation
  ELSIF metadata_account_type = 'client' OR signup_source = 'client_signup' OR signup_source = 'enhanced_client_signup' THEN
    account_type_to_assign := 'client';
    
  -- PRIORITY 3: Check referrer URL (MAIN LOGIC)
  ELSIF referrer_url LIKE '%user.usergy.ai%' THEN
    account_type_to_assign := 'user';
  ELSIF referrer_url LIKE '%client.usergy.ai%' THEN
    account_type_to_assign := 'client';
    
  -- PRIORITY 4: OAuth signups - check referrer to determine portal
  ELSIF provider_name IN ('google', 'github', 'facebook') THEN
    -- For OAuth, we rely on the referrer URL being captured during auth initiation
    -- If no referrer is available, default based on current deployment context
    IF referrer_url IS NULL OR referrer_url = '' THEN
      -- Since this is currently client.usergy.ai deployment, default to client
      account_type_to_assign := 'client';
    ELSE
      -- This should have been caught in PRIORITY 3, but as fallback
      account_type_to_assign := 'client';
    END IF;
    
  -- PRIORITY 5: Default fallback - based on current deployment context
  ELSE
    -- Since this is currently deployed on client.usergy.ai, default to client
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
    
    -- Create initial company profile for OAuth users
    IF provider_name = 'google' THEN
      INSERT INTO client_workspace.company_profiles (
        auth_user_id,
        company_name,
        onboarding_status
      ) VALUES (
        user_id_param,
        COALESCE(user_metadata->>'companyName', user_metadata->>'company_name', 'My Company'),
        'pending'
      )
      ON CONFLICT (auth_user_id) DO UPDATE SET
        company_name = COALESCE(EXCLUDED.company_name, client_workspace.company_profiles.company_name),
        updated_at = NOW();
    END IF;
  END IF;
  
  -- Log the final assignment
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context,
    user_id,
    metadata
  ) VALUES (
    'info',
    'Account type assignment completed successfully',
    'assign_account_type_by_domain',
    user_id_param,
    jsonb_build_object(
      'email', user_email,
      'final_account_type', account_type_to_assign,
      'provider', provider_name,
      'assignment_method', CASE 
        WHEN metadata_account_type = 'user' OR signup_source = 'user_signup' THEN 'explicit_user_metadata'
        WHEN metadata_account_type = 'client' OR signup_source IN ('client_signup', 'enhanced_client_signup') THEN 'explicit_client_metadata'
        WHEN referrer_url LIKE '%user.usergy.ai%' THEN 'user_referrer_url'
        WHEN referrer_url LIKE '%client.usergy.ai%' THEN 'client_referrer_url'
        WHEN provider_name = 'google' AND (referrer_url IS NULL OR referrer_url = '') THEN 'google_oauth_client_default'
        ELSE 'client_fallback'
      END
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'account_type', account_type_to_assign,
    'message', 'Account type assigned successfully with referrer URL prioritization',
    'assignment_method', CASE 
      WHEN metadata_account_type = 'user' OR signup_source = 'user_signup' THEN 'explicit_user_metadata'
      WHEN metadata_account_type = 'client' OR signup_source IN ('client_signup', 'enhanced_client_signup') THEN 'explicit_client_metadata'
      WHEN referrer_url LIKE '%user.usergy.ai%' THEN 'user_referrer_url'
      WHEN referrer_url LIKE '%client.usergy.ai%' THEN 'client_referrer_url'
      WHEN provider_name = 'google' AND (referrer_url IS NULL OR referrer_url = '') THEN 'google_oauth_client_default'
      ELSE 'client_fallback'
    END
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
$function$;
