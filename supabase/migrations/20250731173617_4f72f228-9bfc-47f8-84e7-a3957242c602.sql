
-- 1. Fix account type assignment function to properly differentiate user.usergy.ai vs client.usergy.ai
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
    'Account type assignment - analyzing signup domain and metadata',
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
    
  -- PRIORITY 2: Check email domain for user.usergy.ai (USER accounts)
  ELSIF user_email LIKE '%@user.usergy.ai' THEN
    account_type_to_assign := 'user';
    
  -- PRIORITY 3: Check for explicit client designation
  ELSIF metadata_account_type = 'client' OR signup_source = 'client_signup' OR signup_source = 'enhanced_client_signup' THEN
    account_type_to_assign := 'client';
    
  -- PRIORITY 4: Check email domain for client.usergy.ai (CLIENT accounts)
  ELSIF user_email LIKE '%@client.usergy.ai' THEN
    account_type_to_assign := 'client';
    
  -- PRIORITY 5: OAuth signups (Google, etc.) - check referrer to determine portal
  ELSIF provider_name IN ('google', 'github', 'facebook') THEN
    -- If referrer indicates user portal, assign user; otherwise client
    IF referrer_url LIKE '%user.usergy.ai%' THEN
      account_type_to_assign := 'user';
    ELSE
      account_type_to_assign := 'client';
    END IF;
    
  -- PRIORITY 6: Referrer-based detection
  ELSIF referrer_url LIKE '%user.usergy.ai%' THEN
    account_type_to_assign := 'user';
  ELSIF referrer_url LIKE '%client.usergy.ai%' THEN
    account_type_to_assign := 'client';
    
  -- PRIORITY 7: Default fallback - since this is currently client.usergy.ai, default to client
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
        WHEN user_email LIKE '%@user.usergy.ai' THEN 'user_domain'
        WHEN metadata_account_type = 'client' OR signup_source IN ('client_signup', 'enhanced_client_signup') THEN 'explicit_client_metadata'
        WHEN user_email LIKE '%@client.usergy.ai' THEN 'client_domain'
        WHEN provider_name = 'google' AND referrer_url LIKE '%user.usergy.ai%' THEN 'google_oauth_user_referrer'
        WHEN provider_name = 'google' THEN 'google_oauth_client_default'
        WHEN referrer_url LIKE '%user.usergy.ai%' THEN 'user_referrer_url'
        WHEN referrer_url LIKE '%client.usergy.ai%' THEN 'client_referrer_url'
        ELSE 'client_fallback'
      END
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'account_type', account_type_to_assign,
    'message', 'Account type assigned successfully with proper domain differentiation',
    'assignment_method', CASE 
      WHEN metadata_account_type = 'user' OR signup_source = 'user_signup' THEN 'explicit_user_metadata'
      WHEN user_email LIKE '%@user.usergy.ai' THEN 'user_domain'
      WHEN metadata_account_type = 'client' OR signup_source IN ('client_signup', 'enhanced_client_signup') THEN 'explicit_client_metadata'
      WHEN user_email LIKE '%@client.usergy.ai' THEN 'client_domain'
      WHEN provider_name = 'google' AND referrer_url LIKE '%user.usergy.ai%' THEN 'google_oauth_user_referrer'
      WHEN provider_name = 'google' THEN 'google_oauth_client_default'
      WHEN referrer_url LIKE '%user.usergy.ai%' THEN 'user_referrer_url'
      WHEN referrer_url LIKE '%client.usergy.ai%' THEN 'client_referrer_url'
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

-- 2. Add RLS policies for user_social_presence table
ALTER TABLE public.user_social_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own social presence data" ON public.user_social_presence
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Fix existing users with incorrect account types (run analysis first)
CREATE OR REPLACE FUNCTION public.fix_incorrect_account_types()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  user_record record;
  users_fixed integer := 0;
  users_analyzed integer := 0;
  correction_log jsonb := '[]'::jsonb;
BEGIN
  -- Analyze and fix users with potentially incorrect account types
  FOR user_record IN
    SELECT u.id, u.email, u.raw_user_meta_data, at.account_type as current_type
    FROM auth.users u
    LEFT JOIN public.account_types at ON u.id = at.auth_user_id
    WHERE u.email_confirmed_at IS NOT NULL
      AND (
        -- Users with user.usergy.ai email but not marked as 'user'
        (u.email LIKE '%@user.usergy.ai' AND (at.account_type IS NULL OR at.account_type != 'user'))
        OR
        -- Users with client.usergy.ai email but not marked as 'client'  
        (u.email LIKE '%@client.usergy.ai' AND (at.account_type IS NULL OR at.account_type != 'client'))
        OR
        -- Users with explicit account type metadata that doesn't match current assignment
        (u.raw_user_meta_data->>'account_type' = 'user' AND (at.account_type IS NULL OR at.account_type != 'user'))
        OR
        (u.raw_user_meta_data->>'account_type' = 'client' AND (at.account_type IS NULL OR at.account_type != 'client'))
      )
  LOOP
    users_analyzed := users_analyzed + 1;
    
    -- Log what we're about to fix
    correction_log := correction_log || jsonb_build_object(
      'user_id', user_record.id,
      'email', user_record.email,
      'old_account_type', user_record.current_type,
      'reason', CASE 
        WHEN user_record.email LIKE '%@user.usergy.ai' THEN 'user_domain_correction'
        WHEN user_record.email LIKE '%@client.usergy.ai' THEN 'client_domain_correction'
        WHEN user_record.raw_user_meta_data->>'account_type' = 'user' THEN 'explicit_user_metadata'
        WHEN user_record.raw_user_meta_data->>'account_type' = 'client' THEN 'explicit_client_metadata'
        ELSE 'unknown_correction'
      END
    );
    
    -- Re-assign account type using the corrected function
    PERFORM public.assign_account_type_by_domain(user_record.id, user_record.email);
    users_fixed := users_fixed + 1;
  END LOOP;
  
  -- Log the correction summary
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context,
    metadata
  ) VALUES (
    'info',
    'Account type correction completed',
    'fix_incorrect_account_types',
    jsonb_build_object(
      'users_analyzed', users_analyzed,
      'users_fixed', users_fixed,
      'corrections', correction_log
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'users_analyzed', users_analyzed,
    'users_fixed', users_fixed,
    'corrections', correction_log,
    'message', 'Account types have been corrected based on proper domain analysis'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'users_analyzed', users_analyzed,
      'users_fixed', users_fixed
    );
END;
$function$;

-- 4. Run the correction function
SELECT public.fix_incorrect_account_types();
