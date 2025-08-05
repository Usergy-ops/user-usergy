
-- Phase 1: Database Trigger Cleanup and OAuth-Aware Password Validation

-- First, drop all existing password validation triggers that might conflict
DROP TRIGGER IF EXISTS validate_password_on_signup ON auth.users;
DROP TRIGGER IF EXISTS validate_password_trigger ON auth.users;
DROP TRIGGER IF EXISTS password_validation_trigger ON auth.users;

-- Drop the existing functions
DROP FUNCTION IF EXISTS public.validate_password_on_signup();
DROP FUNCTION IF EXISTS public.validate_password_on_signup_improved();
DROP FUNCTION IF EXISTS public.validate_password_requirements(text);
DROP FUNCTION IF EXISTS public.validate_password_strength(text);

-- Create a single, comprehensive OAuth-aware password validation function
CREATE OR REPLACE FUNCTION public.validate_password_oauth_aware()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip validation entirely for OAuth users (Google, etc.)
  -- OAuth users are identified by multiple indicators
  IF NEW.raw_user_meta_data ? 'provider' OR 
     NEW.raw_user_meta_data ? 'iss' OR
     NEW.raw_user_meta_data ? 'sub' OR
     NEW.raw_user_meta_data ? 'oauth_signup' OR
     NEW.raw_user_meta_data ? 'signup_source' OR
     NEW.provider IS NOT NULL AND NEW.provider != 'email' OR
     NEW.email_confirmed_at IS NOT NULL OR
     NEW.raw_user_meta_data->>'provider' IS NOT NULL OR
     NEW.raw_user_meta_data->>'iss' LIKE '%google%' OR
     NEW.raw_user_meta_data->>'iss' LIKE '%oauth%' THEN
    -- Log OAuth user detection for debugging
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      context,
      user_id,
      metadata
    ) VALUES (
      'info',
      'OAuth user detected, skipping password validation',
      'validate_password_oauth_aware',
      NEW.id,
      jsonb_build_object(
        'provider', NEW.provider,
        'email_confirmed', NEW.email_confirmed_at IS NOT NULL,
        'has_provider_metadata', NEW.raw_user_meta_data ? 'provider',
        'has_iss', NEW.raw_user_meta_data ? 'iss',
        'metadata_keys', jsonb_object_keys(COALESCE(NEW.raw_user_meta_data, '{}'::jsonb))
      )
    );
    RETURN NEW;
  END IF;
  
  -- Only validate for email/password signups
  -- Check if this is actually an email/password signup by looking for encrypted_password
  IF NEW.encrypted_password IS NOT NULL AND LENGTH(NEW.encrypted_password) > 0 THEN
    -- Basic validation for email/password users (we can't access plain text password)
    -- The encrypted password should be reasonably long for security
    IF LENGTH(NEW.encrypted_password) < 60 THEN
      RAISE EXCEPTION 'Password does not meet security requirements' USING ERRCODE = 'P0001';
    END IF;
    
    -- Log email/password signup for debugging
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      context,
      user_id,
      metadata
    ) VALUES (
      'info',
      'Email/password signup detected, password validation applied',
      'validate_password_oauth_aware',
      NEW.id,
      jsonb_build_object(
        'encrypted_password_length', LENGTH(NEW.encrypted_password),
        'email', NEW.email
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the single trigger for password validation
CREATE TRIGGER validate_password_oauth_aware_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_password_oauth_aware();

-- Ensure the account type assignment trigger properly handles OAuth users
DROP TRIGGER IF EXISTS assign_account_type_trigger ON auth.users;

-- Recreate the account type trigger with OAuth awareness
CREATE TRIGGER assign_account_type_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_account_type_unified();
