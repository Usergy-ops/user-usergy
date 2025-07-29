
-- First, let's fix the account_types table constraint issue
-- The current unique constraint allows multiple account types per user
-- We need to enforce that each user can only have ONE account type

-- Drop the existing problematic constraint
ALTER TABLE public.account_types DROP CONSTRAINT IF EXISTS account_types_auth_user_id_account_type_key;

-- Add a proper unique constraint on auth_user_id only (one account type per user)
ALTER TABLE public.account_types ADD CONSTRAINT account_types_auth_user_id_unique UNIQUE (auth_user_id);

-- Update RLS policies on account_types to allow users to view their own account type
-- but prevent them from modifying it (only system can assign roles)
DROP POLICY IF EXISTS "Users view own account types" ON public.account_types;

CREATE POLICY "Users can view their own account type" 
ON public.account_types 
FOR SELECT 
USING (auth_user_id = auth.uid());

-- Service role can manage all account types (for system operations)
CREATE POLICY "Service role can manage account types" 
ON public.account_types 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create a function to safely assign account types based on email domain
CREATE OR REPLACE FUNCTION public.assign_account_type_by_domain(user_id_param uuid, user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  account_type_to_assign text;
  full_name text;
  name_parts text[];
  first_name text := '';
  last_name text := '';
BEGIN
  -- Determine account type based on email domain
  IF user_email LIKE '%@client.usergy.ai' THEN
    account_type_to_assign := 'client';
  ELSE
    account_type_to_assign := 'user';
  END IF;
  
  -- Insert account type (will fail if user already has one due to unique constraint)
  INSERT INTO public.account_types (auth_user_id, account_type)
  VALUES (user_id_param, account_type_to_assign)
  ON CONFLICT (auth_user_id) DO NOTHING;
  
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
        ELSE 'user_domain'
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

-- Create the main authentication trigger that replaces all existing ones
-- This will handle both user and client account creation based on domain
CREATE OR REPLACE FUNCTION public.handle_unified_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
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

-- Drop all existing conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_client_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_google_oauth_client_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_profile_creation_trigger ON auth.users;

-- Create the unified trigger
CREATE TRIGGER unified_user_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_unified_user_signup();

-- Create a function to help identify and fix existing users without account types
CREATE OR REPLACE FUNCTION public.fix_existing_users_without_account_types()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  user_record record;
  users_fixed integer := 0;
  users_processed integer := 0;
BEGIN
  -- Process all users who don't have an account type assigned
  FOR user_record IN
    SELECT u.id, u.email, u.created_at
    FROM auth.users u
    LEFT JOIN public.account_types at ON u.id = at.auth_user_id
    WHERE at.auth_user_id IS NULL
      AND u.email_confirmed_at IS NOT NULL
  LOOP
    users_processed := users_processed + 1;
    
    -- Assign account type based on email domain
    PERFORM public.assign_account_type_by_domain(user_record.id, user_record.email);
    users_fixed := users_fixed + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'users_processed', users_processed,
    'users_fixed', users_fixed,
    'message', 'Existing users have been assigned account types'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'users_processed', users_processed,
      'users_fixed', users_fixed
    );
END;
$$;

-- Create helper functions for role checking that applications can use
CREATE OR REPLACE FUNCTION public.is_user_account(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.account_types 
    WHERE auth_user_id = user_id_param 
    AND account_type = 'user'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_account_type(user_id_param uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  account_type_result text;
BEGIN
  SELECT account_type INTO account_type_result
  FROM public.account_types 
  WHERE auth_user_id = user_id_param;
  
  RETURN COALESCE(account_type_result, 'unknown');
END;
$$;

-- Update RLS policies on user-related tables to ensure proper isolation
-- Update profiles table RLS to only allow 'user' account types
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "User account types can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id AND public.is_user_account());

CREATE POLICY "User account types can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND public.is_user_account());

CREATE POLICY "User account types can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND public.is_user_account());

-- Update user_devices table RLS to only allow 'user' account types
DROP POLICY IF EXISTS "Users can manage their own devices" ON public.user_devices;

CREATE POLICY "User account types can manage their own devices" 
ON public.user_devices 
FOR ALL 
USING (user_id = auth.uid() AND public.is_user_account())
WITH CHECK (user_id = auth.uid() AND public.is_user_account());

-- Update user_tech_fluency table RLS to only allow 'user' account types
DROP POLICY IF EXISTS "Users can manage their own tech fluency" ON public.user_tech_fluency;

CREATE POLICY "User account types can manage their own tech fluency" 
ON public.user_tech_fluency 
FOR ALL 
USING (user_id = auth.uid() AND public.is_user_account())
WITH CHECK (user_id = auth.uid() AND public.is_user_account());

-- Update user_skills table RLS to only allow 'user' account types
DROP POLICY IF EXISTS "Users can manage their own skills" ON public.user_skills;

CREATE POLICY "User account types can manage their own skills" 
ON public.user_skills 
FOR ALL 
USING (user_id = auth.uid() AND public.is_user_account())
WITH CHECK (user_id = auth.uid() AND public.is_user_account());

-- Update user_social_presence table RLS to only allow 'user' account types
DROP POLICY IF EXISTS "Users can manage their own social presence" ON public.user_social_presence;

CREATE POLICY "User account types can manage their own social presence" 
ON public.user_social_presence 
FOR ALL 
USING (user_id = auth.uid() AND public.is_user_account())
WITH CHECK (user_id = auth.uid() AND public.is_user_account());

-- Update consolidated_social_presence table RLS to only allow 'user' account types
DROP POLICY IF EXISTS "Users can manage their own consolidated social presence" ON public.consolidated_social_presence;

CREATE POLICY "User account types can manage their own consolidated social presence" 
ON public.consolidated_social_presence 
FOR ALL 
USING (user_id = auth.uid() AND public.is_user_account())
WITH CHECK (user_id = auth.uid() AND public.is_user_account());
