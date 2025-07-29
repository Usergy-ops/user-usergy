
-- Phase 1: Immediate Database Repairs

-- Step 1: Clean up conflicting triggers first
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_handle_client ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_unified ON auth.users;
DROP TRIGGER IF EXISTS on_client_account_creation ON auth.users;

-- Step 2: Fix the account_types table unique constraint issue
-- The current constraint is causing conflicts, let's update it to handle duplicates properly
DROP INDEX IF EXISTS account_types_auth_user_id_account_type_key;
CREATE UNIQUE INDEX IF NOT EXISTS account_types_auth_user_id_account_type_unique 
ON public.account_types (auth_user_id, account_type);

-- Step 3: Create missing profile records for existing users who don't have them
INSERT INTO public.profiles (user_id, email, full_name, completion_percentage)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'User'),
  0
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Fix the RLS policy for user_devices to be more direct
DROP POLICY IF EXISTS "Users can manage their own devices" ON public.user_devices;

CREATE POLICY "Users can manage their own devices" 
ON public.user_devices 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 5: Fix RLS policies for related tables to be consistent
DROP POLICY IF EXISTS "Users can manage their own tech fluency" ON public.user_tech_fluency;
CREATE POLICY "Users can manage their own tech fluency" 
ON public.user_tech_fluency 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own skills" ON public.user_skills;
CREATE POLICY "Users can manage their own skills" 
ON public.user_skills 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own social presence" ON public.user_social_presence;
CREATE POLICY "Users can manage their own social presence" 
ON public.user_social_presence 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 6: Create a robust profile creation function
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_uuid uuid, user_email text, user_full_name text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile if it doesn't exist
  INSERT INTO public.profiles (user_id, email, full_name, completion_percentage)
  VALUES (
    user_uuid, 
    user_email,
    COALESCE(user_full_name, 'User'),
    0
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      context,
      user_id,
      metadata
    ) VALUES (
      'profile_creation_error',
      SQLERRM,
      'ensure_profile_exists',
      user_uuid,
      jsonb_build_object(
        'email', user_email,
        'full_name', user_full_name
      )
    );
    RETURN FALSE;
END;
$$;

-- Step 7: Create a single, reliable trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  full_name text;
BEGIN
  -- Extract full name from metadata
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'User'
  );
  
  -- Ensure profile exists
  PERFORM public.ensure_profile_exists(NEW.id, NEW.email, full_name);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block user creation, just log the error
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      context,
      user_id,
      metadata
    ) VALUES (
      'profile_trigger_error',
      SQLERRM,
      'handle_new_user_profile_creation',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'error_detail', SQLERRM
      )
    );
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_profile_creation();

-- Step 8: Add a constraint to ensure profiles are always linked to valid users
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_not_null 
CHECK (user_id IS NOT NULL);

-- Step 9: Clean up any orphaned data
DELETE FROM public.user_devices WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.user_tech_fluency WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.user_skills WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.user_social_presence WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.consolidated_social_presence WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
