
-- Phase 2: Security Hardening - Add missing search_path to remaining functions

-- Update cleanup functions with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.user_otp_verification 
  WHERE expires_at < NOW() 
    AND (verified_at IS NULL OR verified_at < NOW() - INTERVAL '1 hour');
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_enhanced_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.enhanced_rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND resolved = TRUE;
END;
$function$;

-- Update validation functions with proper search_path
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Check minimum length (12 characters)
  IF LENGTH(password) < 12 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for digit
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for special character
  IF password !~ '[@$!%*?&]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_password_requirements(password_hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- This function validates that a password hash exists and is properly formatted
  -- The actual password validation should be done on the client side
  -- This is just a placeholder for future password policy enforcement
  RETURN password_hash IS NOT NULL AND LENGTH(password_hash) > 10;
END;
$function$;

-- Update trigger functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_rate_limits_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
