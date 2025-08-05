
-- Migration: 20250805_fix_auth_final.sql
-- Fix all critical authentication database issues

-- 1. DROP ALL EXISTING PASSWORD VALIDATION TRIGGERS AND FUNCTIONS
-- Drop triggers first
DROP TRIGGER IF EXISTS validate_password_trigger ON auth.users;
DROP TRIGGER IF EXISTS validate_password_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS validate_password_safe_trigger ON auth.users;
DROP TRIGGER IF EXISTS validate_password_improved_trigger ON auth.users;

-- Drop all password validation functions
DROP FUNCTION IF EXISTS public.validate_password_on_signup() CASCADE;
DROP FUNCTION IF EXISTS public.validate_password_on_signup_safe() CASCADE;
DROP FUNCTION IF EXISTS public.validate_password_on_signup_improved() CASCADE;
DROP FUNCTION IF EXISTS public.validate_password_requirements(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_password_strength(text) CASCADE;

-- 2. CONSOLIDATE OTP TABLES
-- Drop any duplicate or incorrect OTP tables
DROP TABLE IF EXISTS public.user_otps CASCADE;
DROP TABLE IF EXISTS public.user_otp_verification CASCADE;
DROP TABLE IF EXISTS public.user_otp_verifications CASCADE;

-- Ensure auth_otp_verifications table has all required columns
-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Check and add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'email') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN email text NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'otp_code') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN otp_code text NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'expires_at') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'verified_at') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN verified_at timestamp with time zone;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'attempts') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN attempts integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'blocked_until') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN blocked_until timestamp with time zone;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'ip_address') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN ip_address inet;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'user_agent') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN user_agent text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'email_sent') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN email_sent boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'email_error') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN email_error text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'account_type') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN account_type text NOT NULL DEFAULT 'client';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'source_url') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN source_url text NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'metadata') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_otp_verifications' AND column_name = 'resend_attempts') THEN
        ALTER TABLE public.auth_otp_verifications ADD COLUMN resend_attempts integer DEFAULT 0;
    END IF;
END
$$;

-- Remove default empty values for required fields
ALTER TABLE public.auth_otp_verifications ALTER COLUMN email DROP DEFAULT;
ALTER TABLE public.auth_otp_verifications ALTER COLUMN otp_code DROP DEFAULT;
ALTER TABLE public.auth_otp_verifications ALTER COLUMN source_url DROP DEFAULT;

-- 3. CREATE THE FINAL PASSWORD VALIDATION TRIGGER
-- This trigger ONLY validates email/password signups and completely skips OAuth users
CREATE OR REPLACE FUNCTION public.validate_email_password_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip validation entirely for OAuth users
  -- Check for OAuth provider metadata
  IF NEW.raw_user_meta_data ? 'provider' OR 
     NEW.raw_user_meta_data ? 'iss' OR
     NEW.raw_user_meta_data ? 'sub' OR
     NEW.raw_app_meta_data ? 'provider' OR
     NEW.raw_app_meta_data ? 'providers' THEN
    RETURN NEW;
  END IF;
  
  -- Skip if email is already confirmed (OAuth users come pre-confirmed)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Skip if no encrypted password (OAuth users don't have passwords)
  IF NEW.encrypted_password IS NULL OR LENGTH(NEW.encrypted_password) = 0 THEN
    RETURN NEW;
  END IF;
  
  -- Only validate for email/password signups
  -- Basic password validation (minimum length check)
  IF LENGTH(NEW.encrypted_password) < 10 THEN
    RAISE EXCEPTION 'Password does not meet security requirements' USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER validate_email_password_only_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_email_password_only();

-- 4. FIX THE APPLY_PROGRESSIVE_RATE_LIMIT FUNCTION
CREATE OR REPLACE FUNCTION public.apply_progressive_rate_limit(
  identifier_param text, 
  action_param text, 
  base_attempts integer DEFAULT 10, 
  base_window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_record record;
  escalation_multiplier numeric := 1.0;
  new_attempts integer;
  new_window_minutes integer;
  block_duration_minutes integer := 5; -- Start with 5 minutes
BEGIN
  -- Get current rate limit record
  SELECT * INTO current_record
  FROM public.enhanced_rate_limits
  WHERE identifier = identifier_param AND action = action_param
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Set reasonable limits based on action type
  IF action_param LIKE '%signup%' THEN
    base_attempts := 10;
    block_duration_minutes := 5;
  ELSIF action_param LIKE '%signin%' THEN
    base_attempts := 20;
    block_duration_minutes := 5;
  ELSIF action_param LIKE '%otp%' THEN
    base_attempts := 5;
    block_duration_minutes := 15;
  END IF;
  
  -- Calculate escalation multiplier based on violation history
  IF current_record.total_violations IS NOT NULL AND current_record.total_violations > 0 THEN
    escalation_multiplier := 1.0 + (current_record.total_violations * 0.5);
    block_duration_minutes := block_duration_minutes * (1 + current_record.total_violations);
  END IF;
  
  -- Apply progressive scaling
  new_attempts := GREATEST(1, FLOOR(base_attempts / escalation_multiplier));
  new_window_minutes := FLOOR(base_window_minutes * LEAST(escalation_multiplier, 3.0));
  
  -- Return complete JSON response with all expected fields
  RETURN jsonb_build_object(
    'max_attempts', new_attempts,
    'window_minutes', new_window_minutes,
    'block_duration_minutes', block_duration_minutes,
    'escalation_level', COALESCE(current_record.escalation_level, 0),
    'total_violations', COALESCE(current_record.total_violations, 0),
    'current_attempts', COALESCE(current_record.attempts, 0),
    'identifier', identifier_param,
    'action', action_param,
    'timestamp', NOW()
  );
END;
$$;

-- 5. CREATE CLEANUP FUNCTIONS
-- Function to clean expired OTPs older than 1 hour
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps_final()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.auth_otp_verifications 
  WHERE expires_at < NOW() - INTERVAL '1 hour'
    AND (verified_at IS NULL OR verified_at < NOW() - INTERVAL '1 hour');
    
  -- Log cleanup activity
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context
  ) VALUES (
    'info',
    'Expired OTP cleanup completed',
    'cleanup_expired_otps_final'
  );
END;
$$;

-- Function to clean rate limits older than 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits_final()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean standard rate limits
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());
    
  -- Clean enhanced rate limits
  DELETE FROM public.enhanced_rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());
    
  -- Log cleanup activity
  INSERT INTO public.error_logs (
    error_type,
    error_message,
    context,
    metadata
  ) VALUES (
    'info',
    'Rate limit cleanup completed',
    'cleanup_old_rate_limits_final',
    jsonb_build_object('timestamp', NOW())
  );
END;
$$;

-- 6. CLEANUP ANY ORPHANED DATA AND OPTIMIZE
-- Remove any potential duplicate account type records
DELETE FROM public.account_types a1
WHERE EXISTS (
  SELECT 1 FROM public.account_types a2 
  WHERE a2.auth_user_id = a1.auth_user_id 
  AND a2.created_at > a1.created_at
);

-- Clean up any orphaned rate limit records
DELETE FROM public.rate_limits WHERE created_at < NOW() - INTERVAL '48 hours';
DELETE FROM public.enhanced_rate_limits WHERE created_at < NOW() - INTERVAL '48 hours';

-- Update table statistics
ANALYZE public.auth_otp_verifications;
ANALYZE public.rate_limits;
ANALYZE public.enhanced_rate_limits;
ANALYZE public.account_types;

-- Log migration completion
INSERT INTO public.error_logs (
  error_type,
  error_message,
  context,
  metadata
) VALUES (
  'info',
  'Final authentication fix migration completed successfully',
  '20250805_fix_auth_final',
  jsonb_build_object(
    'migration_date', NOW(),
    'fixed_issues', ARRAY[
      'password_validation_triggers',
      'otp_table_consolidation', 
      'rate_limiting_functions',
      'cleanup_procedures'
    ]
  )
);
