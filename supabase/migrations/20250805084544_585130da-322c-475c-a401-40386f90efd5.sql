
-- Phase 1: Database Schema Fixes

-- Add the missing ip_address column to auth_otp_verifications table
ALTER TABLE public.auth_otp_verifications 
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS blocked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_error text;

-- Update the password validation trigger to exclude OAuth users
-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS validate_password_on_signup ON auth.users;

-- Create an improved password validation function that excludes OAuth users
CREATE OR REPLACE FUNCTION public.validate_password_on_signup_improved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip validation for OAuth users (they don't have passwords set by us)
  IF NEW.raw_user_meta_data ? 'provider' AND NEW.raw_user_meta_data->>'provider' != 'email' THEN
    RETURN NEW;
  END IF;
  
  -- Skip validation if this is an OAuth callback (indicated by provider metadata)
  IF NEW.raw_user_meta_data ? 'iss' THEN
    RETURN NEW;
  END IF;
  
  -- Only validate for email/password signups
  IF NEW.encrypted_password IS NULL OR LENGTH(NEW.encrypted_password) < 10 THEN
    RAISE EXCEPTION 'Password does not meet security requirements' USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger with the improved function
CREATE TRIGGER validate_password_on_signup_improved
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_password_on_signup_improved();

-- Add cleanup function for auth_otp_verifications
CREATE OR REPLACE FUNCTION public.cleanup_auth_otp_verifications()
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

-- Update the comprehensive system cleanup to include the new function
CREATE OR REPLACE FUNCTION public.comprehensive_system_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  cleanup_results jsonb := '{}';
  expired_sessions integer;
  old_metrics integer;
  old_performance_logs integer;
  old_auth_otp integer;
BEGIN
  -- Clean up expired sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR (last_activity < now() - INTERVAL '30 days');
  GET DIAGNOSTICS expired_sessions = ROW_COUNT;
  
  -- Clean up old system metrics (keep 30 days)
  DELETE FROM public.system_metrics 
  WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS old_metrics = ROW_COUNT;
  
  -- Clean up old performance logs (keep 7 days)
  DELETE FROM public.performance_logs 
  WHERE created_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS old_performance_logs = ROW_COUNT;
  
  -- Clean up old auth OTP verifications
  DELETE FROM public.auth_otp_verifications 
  WHERE expires_at < now() - INTERVAL '1 day';
  GET DIAGNOSTICS old_auth_otp = ROW_COUNT;
  
  -- Call existing cleanup functions
  PERFORM public.cleanup_expired_otp();
  PERFORM public.cleanup_old_rate_limits();
  PERFORM public.cleanup_old_enhanced_rate_limits();
  PERFORM public.cleanup_old_error_logs();
  
  cleanup_results := jsonb_build_object(
    'expired_sessions_cleaned', expired_sessions,
    'old_metrics_cleaned', old_metrics,
    'old_performance_logs_cleaned', old_performance_logs,
    'old_auth_otp_cleaned', old_auth_otp,
    'timestamp', now(),
    'success', true
  );
  
  -- Log cleanup results
  INSERT INTO public.error_logs (
    error_type, error_message, context, metadata
  ) VALUES (
    'info', 'System cleanup completed', 'comprehensive_system_cleanup', cleanup_results
  );
  
  RETURN cleanup_results;
END;
$function$;
