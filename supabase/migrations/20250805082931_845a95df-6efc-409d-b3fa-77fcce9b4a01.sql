
-- Fix 1: Drop the problematic password validation trigger for OAuth users
DROP TRIGGER IF EXISTS validate_password_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.validate_password_on_signup();

-- Fix 2: Create a better password validation trigger that excludes OAuth users
CREATE OR REPLACE FUNCTION public.validate_password_on_signup_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only validate password for email/password signups (not OAuth)
  -- OAuth users won't have encrypted_password set the same way
  IF NEW.email_confirmed_at IS NULL AND NEW.encrypted_password IS NOT NULL AND LENGTH(NEW.encrypted_password) < 10 THEN
    RAISE EXCEPTION 'Password does not meet minimum requirements';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the new safe trigger
CREATE TRIGGER validate_password_on_signup_safe
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_password_on_signup_safe();

-- Fix 3: Ensure the correct OTP table name is used consistently
-- Drop the old table if it exists with wrong name
DROP TABLE IF EXISTS public.user_otp_verification;

-- Ensure auth_otp_verifications table has all needed columns
ALTER TABLE public.auth_otp_verifications 
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_error TEXT,
ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Fix 4: Add cleanup function for the correct table
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.auth_otp_verifications 
  WHERE expires_at < NOW() 
    AND (verified_at IS NULL OR verified_at < NOW() - INTERVAL '1 hour');
END;
$function$;

-- Fix 5: Add database function for comprehensive cleanup
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$function$;
