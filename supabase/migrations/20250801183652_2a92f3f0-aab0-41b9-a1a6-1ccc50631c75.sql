
-- Step 1: Remove unused client workflow tables and schema
DROP TABLE IF EXISTS client_workflow.clients CASCADE;
DROP SCHEMA IF EXISTS client_workflow CASCADE;

-- Step 2: Remove unused client workspace tables and schema  
DROP TABLE IF EXISTS client_workspace.company_profiles CASCADE;
DROP SCHEMA IF EXISTS client_workspace CASCADE;

-- Step 3: Remove unused monitoring and profile tables
DROP TABLE IF EXISTS auth_monitoring CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Step 4: Remove legacy OTP verification table (replaced by auth_otp_verifications)
DROP TABLE IF EXISTS user_otp_verification CASCADE;

-- Step 5: Remove unused database functions
DROP FUNCTION IF EXISTS public.assign_account_type_unified() CASCADE;
DROP FUNCTION IF EXISTS public.fix_incorrect_account_types() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_client_account_robust(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.save_complete_client_profile(uuid, text, text, text, text, text, text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_client_account(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.is_client_account(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.test_email_configuration() CASCADE;
DROP FUNCTION IF EXISTS public.check_email_exists_for_account_type(text, text) CASCADE;

-- Step 6: Update remaining functions to add search_path for security
CREATE OR REPLACE FUNCTION public.assign_account_type_by_domain(user_id_param uuid, email_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  account_type_determined text := 'client'; -- Default fallback
BEGIN
  -- Enhanced domain-based detection
  IF email_param LIKE '%@user.usergy.ai' OR email_param LIKE '%user.usergy.ai%' THEN
    account_type_determined := 'user';
  ELSIF email_param LIKE '%@client.usergy.ai' OR email_param LIKE '%client.usergy.ai%' THEN
    account_type_determined := 'client';
  ELSE
    -- Check user metadata for explicit account type
    SELECT COALESCE(raw_user_meta_data->>'account_type', 'client') 
    INTO account_type_determined
    FROM auth.users 
    WHERE id = user_id_param;
  END IF;

  -- Insert or update account type
  INSERT INTO public.account_types (auth_user_id, account_type)
  VALUES (user_id_param, account_type_determined)
  ON CONFLICT (auth_user_id) DO UPDATE SET
    account_type = account_type_determined,
    created_at = CURRENT_TIMESTAMP;

  RETURN jsonb_build_object(
    'success', true,
    'account_type', account_type_determined,
    'message', 'Account type assigned successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Step 7: Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_completion ON public.profiles(completion_percentage);
CREATE INDEX IF NOT EXISTS idx_account_types_user_id ON public.account_types(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_enhanced_rate_limits_identifier_action ON public.enhanced_rate_limits(identifier, action);

-- Step 8: Ensure proper RLS policies are in place for core tables
-- Update profiles RLS policy
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Update consolidated_social_presence RLS policy  
DROP POLICY IF EXISTS "Users can manage their own social presence" ON public.consolidated_social_presence;
CREATE POLICY "Users can manage their own social presence" ON public.consolidated_social_presence
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Step 9: Create trigger to automatically assign account types on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_account_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  account_type_determined text := 'client';
  user_email text;
BEGIN
  user_email := NEW.email;
  
  -- Determine account type from metadata first (highest priority)
  IF NEW.raw_user_meta_data->>'account_type' IN ('user', 'client') THEN
    account_type_determined := NEW.raw_user_meta_data->>'account_type';
  -- Then check email domain
  ELSIF user_email LIKE '%@user.usergy.ai' OR user_email LIKE '%user.usergy.ai%' THEN
    account_type_determined := 'user';
  ELSIF user_email LIKE '%@client.usergy.ai' OR user_email LIKE '%client.usergy.ai%' THEN
    account_type_determined := 'client';
  -- Check signup source
  ELSIF NEW.raw_user_meta_data->>'signup_source' LIKE '%user%' THEN
    account_type_determined := 'user';
  ELSIF NEW.raw_user_meta_data->>'signup_source' LIKE '%client%' THEN
    account_type_determined := 'client';
  -- Check source URL
  ELSIF NEW.raw_user_meta_data->>'source_url' LIKE '%user.usergy.ai%' THEN
    account_type_determined := 'user';
  END IF;

  -- Insert account type
  INSERT INTO public.account_types (auth_user_id, account_type)
  VALUES (NEW.id, account_type_determined);
  
  -- Create profile record
  INSERT INTO public.profiles (user_id, email, full_name, completion_percentage)
  VALUES (
    NEW.id,
    user_email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    0
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      context,
      user_id,
      metadata
    ) VALUES (
      'account_type_assignment_error',
      SQLERRM,
      'handle_new_user_account_type',
      NEW.id,
      jsonb_build_object(
        'email', user_email,
        'metadata', NEW.raw_user_meta_data
      )
    );
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_account_type();
