
-- Step 1: Database Security Hardening
-- Fix functions with mutable search_path and add security improvements

-- Update assign_account_type_unified to have proper implementation and secure search_path
CREATE OR REPLACE FUNCTION public.assign_account_type_unified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  correct_type text := 'client'; -- Default fallback
  metadata_type text;
  signup_source text;
  source_url text;
  user_email text;
BEGIN
  -- Get user email and metadata
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Extract metadata values
  metadata_type := NEW.raw_user_meta_data->>'account_type';
  signup_source := NEW.raw_user_meta_data->>'signup_source';
  source_url := NEW.raw_user_meta_data->>'source_url';
  
  -- Apply account type determination logic (same as edge function)
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
  
  -- Log the assignment
  INSERT INTO public.error_logs (
    user_id,
    error_type,
    error_message,
    context,
    metadata
  ) VALUES (
    NEW.id,
    'account_type_auto_assignment',
    'Account type automatically assigned via trigger',
    'assign_account_type_unified',
    jsonb_build_object(
      'account_type', correct_type,
      'email', user_email,
      'metadata_type', metadata_type,
      'signup_source', signup_source,
      'source_url', source_url
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created_assign_account_type ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_account_type
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_account_type_unified();

-- Update other functions to have secure search_path
CREATE OR REPLACE FUNCTION public.fix_incorrect_account_types()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    
    -- Re-assign account type using the manual function
    PERFORM public.manually_assign_account_type(
      user_record.id, 
      CASE 
        WHEN user_record.email LIKE '%@user.usergy.ai' OR user_record.raw_user_meta_data->>'account_type' = 'user' THEN 'user'
        ELSE 'client'
      END
    );
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

-- Add password validation trigger
CREATE OR REPLACE FUNCTION public.validate_password_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Basic password validation (since we can't access the plain password, we validate the encrypted_password length)
  IF NEW.encrypted_password IS NULL OR LENGTH(NEW.encrypted_password) < 10 THEN
    RAISE EXCEPTION 'Password does not meet security requirements';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for password validation
DROP TRIGGER IF EXISTS validate_password_trigger ON auth.users;
CREATE TRIGGER validate_password_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_password_on_signup();

-- Create function to sync client_workflow.clients with account_types
CREATE OR REPLACE FUNCTION public.sync_client_workflow_integration()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_record record;
  synced_count integer := 0;
BEGIN
  -- Sync client account types with client_workflow.clients table
  FOR client_record IN
    SELECT DISTINCT at.auth_user_id, u.email
    FROM public.account_types at
    JOIN auth.users u ON at.auth_user_id = u.id
    WHERE at.account_type = 'client'
      AND NOT EXISTS (
        SELECT 1 FROM client_workflow.clients c 
        WHERE c.auth_user_id = at.auth_user_id
      )
  LOOP
    -- Insert basic client record
    INSERT INTO client_workflow.clients (
      auth_user_id,
      email,
      company_name,
      onboarding_status
    ) VALUES (
      client_record.auth_user_id,
      client_record.email,
      'My Company',
      'pending'
    );
    
    synced_count := synced_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'synced_records', synced_count,
    'message', 'Client workflow integration synchronized'
  );
END;
$$;

-- Add resend attempt limit to OTP table
ALTER TABLE public.auth_otp_verifications 
ADD COLUMN IF NOT EXISTS resend_attempts INTEGER DEFAULT 0;

-- Add metadata indexing for better performance
CREATE INDEX IF NOT EXISTS idx_auth_otp_metadata ON public.auth_otp_verifications USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_error_logs_metadata ON public.error_logs USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_enhanced_rate_limits_metadata ON public.enhanced_rate_limits USING GIN (metadata);
