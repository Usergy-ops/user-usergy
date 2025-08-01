
-- Phase 1: Fix the simple_assign_account_type trigger function
-- The current function has logic issues that cause account type mismatches

CREATE OR REPLACE FUNCTION public.simple_assign_account_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  detected_type TEXT := 'client'; -- Default fallback
  user_email TEXT;
  signup_source TEXT;
  metadata_type TEXT;
BEGIN
  user_email := NEW.email;
  signup_source := NEW.raw_user_meta_data->>'signup_source';
  metadata_type := NEW.raw_user_meta_data->>'account_type';
  
  -- Only process confirmed users (email confirmed or OAuth)
  IF NEW.email_confirmed_at IS NOT NULL OR 
     NEW.raw_app_meta_data->>'provider' IN ('google', 'github', 'facebook') THEN
    
    -- Enhanced account type detection logic with proper priority
    -- Priority 1: Explicit metadata account_type
    IF metadata_type IN ('user', 'client') THEN
      detected_type := metadata_type;
    -- Priority 2: Email domain detection
    ELSIF user_email LIKE '%@user.usergy.ai' OR user_email LIKE '%user.usergy.ai%' THEN
      detected_type := 'user';
    ELSIF user_email LIKE '%@client.usergy.ai' OR user_email LIKE '%client.usergy.ai%' THEN
      detected_type := 'client';
    -- Priority 3: Signup source detection
    ELSIF signup_source LIKE '%user%' THEN
      detected_type := 'user';
    ELSIF signup_source LIKE '%client%' THEN
      detected_type := 'client';
    -- Priority 4: URL context from metadata
    ELSIF NEW.raw_user_meta_data->>'source_url' LIKE '%user.usergy.ai%' THEN
      detected_type := 'user';
    ELSE
      detected_type := 'client'; -- Default fallback
    END IF;
    
    -- Insert account type record with better conflict handling
    INSERT INTO public.account_types (auth_user_id, account_type)
    VALUES (NEW.id, detected_type)
    ON CONFLICT (auth_user_id) DO UPDATE SET
      account_type = EXCLUDED.account_type,
      created_at = CURRENT_TIMESTAMP
    WHERE account_types.account_type != EXCLUDED.account_type;
    
    -- Log successful assignment with more detail
    INSERT INTO public.error_logs (
      user_id,
      error_type,
      error_message,
      context,
      metadata
    ) VALUES (
      NEW.id,
      'info',
      'Account type assigned successfully',
      'simple_assign_account_type',
      jsonb_build_object(
        'assigned_type', detected_type,
        'email', user_email,
        'signup_source', signup_source,
        'metadata_type', metadata_type,
        'detection_method', CASE 
          WHEN metadata_type IN ('user', 'client') THEN 'explicit_metadata'
          WHEN user_email LIKE '%user.usergy.ai%' THEN 'user_email_domain'
          WHEN user_email LIKE '%client.usergy.ai%' THEN 'client_email_domain'
          WHEN signup_source LIKE '%user%' THEN 'signup_source_user'
          WHEN signup_source LIKE '%client%' THEN 'signup_source_client'
          ELSE 'default_fallback'
        END
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but never block user creation
    INSERT INTO public.error_logs (
      user_id,
      error_type,
      error_message,
      context,
      metadata
    ) VALUES (
      NEW.id,
      'account_type_assignment_error',
      SQLERRM,
      'simple_assign_account_type',
      jsonb_build_object(
        'email', user_email,
        'signup_source', signup_source,
        'metadata_type', metadata_type,
        'error_detail', SQLERRM
      )
    );
    RETURN NEW;
END;
$function$;

-- Create function to fix existing account type mismatches
CREATE OR REPLACE FUNCTION public.fix_account_type_mismatches()
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
  correct_type text;
BEGIN
  -- Analyze users with potential mismatches
  FOR user_record IN
    SELECT 
      u.id, 
      u.email, 
      u.raw_user_meta_data, 
      at.account_type as current_type,
      u.raw_user_meta_data->>'signup_source' as signup_source,
      u.raw_user_meta_data->>'account_type' as metadata_type
    FROM auth.users u
    LEFT JOIN public.account_types at ON u.id = at.auth_user_id
    WHERE u.email_confirmed_at IS NOT NULL
  LOOP
    users_analyzed := users_analyzed + 1;
    correct_type := 'client'; -- Default
    
    -- Apply same logic as the trigger
    IF user_record.metadata_type IN ('user', 'client') THEN
      correct_type := user_record.metadata_type;
    ELSIF user_record.email LIKE '%@user.usergy.ai' OR user_record.email LIKE '%user.usergy.ai%' THEN
      correct_type := 'user';
    ELSIF user_record.email LIKE '%@client.usergy.ai' OR user_record.email LIKE '%client.usergy.ai%' THEN
      correct_type := 'client';
    ELSIF user_record.signup_source LIKE '%user%' THEN
      correct_type := 'user';
    ELSIF user_record.signup_source LIKE '%client%' THEN
      correct_type := 'client';
    ELSIF user_record.raw_user_meta_data->>'source_url' LIKE '%user.usergy.ai%' THEN
      correct_type := 'user';
    END IF;
    
    -- Only fix if there's a mismatch or missing account type
    IF user_record.current_type IS NULL OR user_record.current_type != correct_type THEN
      -- Insert or update account type
      INSERT INTO public.account_types (auth_user_id, account_type)
      VALUES (user_record.id, correct_type)
      ON CONFLICT (auth_user_id) DO UPDATE SET
        account_type = correct_type,
        created_at = CURRENT_TIMESTAMP;
        
      users_fixed := users_fixed + 1;
      
      correction_log := correction_log || jsonb_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'old_account_type', user_record.current_type,
        'new_account_type', correct_type,
        'reason', CASE 
          WHEN user_record.metadata_type IN ('user', 'client') THEN 'explicit_metadata'
          WHEN user_record.email LIKE '%user.usergy.ai%' THEN 'user_email_domain'
          WHEN user_record.email LIKE '%client.usergy.ai%' THEN 'client_email_domain'
          ELSE 'signup_source_or_default'
        END
      );
    END IF;
  END LOOP;
  
  -- Log the correction summary
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context,
    metadata
  ) VALUES (
    'info',
    'Account type mismatch correction completed',
    'fix_account_type_mismatches',
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
    'message', 'Account type mismatches have been corrected'
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

-- Add missing RLS policies for better security
-- Ensure profiles table has proper RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can manage their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all profiles
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.assign_account_type_by_domain(user_id_param uuid, email_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  detected_type text := 'client';
BEGIN
  -- Determine account type based on email domain
  IF email_param LIKE '%@user.usergy.ai' OR email_param LIKE '%user.usergy.ai%' THEN
    detected_type := 'user';
  ELSE
    detected_type := 'client';
  END IF;

  -- Insert or update account type
  INSERT INTO public.account_types (auth_user_id, account_type)
  VALUES (user_id_param, detected_type)
  ON CONFLICT (auth_user_id) DO UPDATE SET
    account_type = detected_type,
    created_at = CURRENT_TIMESTAMP;

  RETURN jsonb_build_object(
    'success', true,
    'account_type', detected_type,
    'message', 'Account type assigned successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Clean up any orphaned data and run the correction function
SELECT public.fix_account_type_mismatches();
