
-- Phase 1: Database Cleanup - Remove all conflicting triggers and orphaned functions

-- 1. Drop ALL existing triggers on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_account_type_assignment_trigger ON auth.users;
DROP TRIGGER IF EXISTS assign_user_account_type_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_confirmed_client_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_profile_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_unified_user_signup_trigger ON auth.users;

-- 2. Drop all orphaned/old functions that are no longer needed
DROP FUNCTION IF EXISTS public.handle_new_user_account_type_assignment() CASCADE;
DROP FUNCTION IF EXISTS public.assign_user_account_type() CASCADE;
DROP FUNCTION IF EXISTS public.assign_account_type_on_signup() CASCADE;
DROP FUNCTION IF EXISTS public.handle_client_user_signup() CASCADE;
DROP FUNCTION IF EXISTS public.handle_confirmed_client_signup() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile_creation() CASCADE;
DROP FUNCTION IF EXISTS public.fix_existing_users_without_account_types() CASCADE;
DROP FUNCTION IF EXISTS public.handle_unified_user_signup() CASCADE;

-- 3. Create the single, clean account type assignment function
CREATE OR REPLACE FUNCTION public.simple_assign_account_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  detected_type TEXT := 'client'; -- Default fallback
  user_email TEXT;
BEGIN
  user_email := NEW.email;
  
  -- Only process confirmed users (email confirmed or OAuth)
  IF NEW.email_confirmed_at IS NOT NULL OR 
     NEW.raw_app_meta_data->>'provider' IN ('google', 'github', 'facebook') THEN
    
    -- Simple account type detection logic
    IF NEW.raw_user_meta_data->>'account_type' = 'user' OR
       user_email LIKE '%user.usergy.ai%' OR
       NEW.raw_user_meta_data->>'signup_source' LIKE '%user%' THEN
      detected_type := 'user';
    ELSE
      detected_type := 'client';
    END IF;
    
    -- Insert account type record
    INSERT INTO public.account_types (auth_user_id, account_type)
    VALUES (NEW.id, detected_type)
    ON CONFLICT (auth_user_id) DO UPDATE SET
      account_type = detected_type,
      created_at = CURRENT_TIMESTAMP;
    
    -- Log successful assignment
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
        'signup_source', NEW.raw_user_meta_data->>'signup_source'
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
        'error_detail', SQLERRM
      )
    );
    RETURN NEW;
END;
$$;

-- 4. Create the single, clean trigger
CREATE TRIGGER assign_account_type_on_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.simple_assign_account_type();

-- 5. Clean up old OTP tables (keep only auth_otp_verifications)
DROP TABLE IF EXISTS public.user_otp_verification CASCADE;

-- 6. Ensure auth_otp_verifications table has proper structure
ALTER TABLE public.auth_otp_verifications 
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN otp_code SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL,
  ALTER COLUMN account_type SET NOT NULL,
  ALTER COLUMN source_url SET NOT NULL;

-- Add any missing columns to auth_otp_verifications if they don't exist
DO $$ 
BEGIN
  -- Add resend_attempts if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='auth_otp_verifications' AND column_name='resend_attempts') THEN
    ALTER TABLE public.auth_otp_verifications ADD COLUMN resend_attempts integer DEFAULT 0;
  END IF;
END $$;

-- 7. Add cleanup function for expired OTP records
CREATE OR REPLACE FUNCTION public.cleanup_expired_unified_otp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.auth_otp_verifications 
  WHERE expires_at < NOW() 
    AND (verified_at IS NULL OR verified_at < NOW() - INTERVAL '1 hour');
END;
$$;
