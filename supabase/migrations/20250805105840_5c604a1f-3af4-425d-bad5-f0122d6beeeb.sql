
-- Fix the password validation trigger to properly handle OAuth users
CREATE OR REPLACE FUNCTION public.validate_password_on_signup_improved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip validation entirely for OAuth users (Google, etc.)
  -- OAuth users have provider metadata and different password handling
  IF NEW.raw_user_meta_data ? 'provider' OR 
     NEW.raw_user_meta_data ? 'iss' OR
     NEW.raw_user_meta_data ? 'sub' OR
     NEW.provider IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Skip validation if email is confirmed (OAuth users come pre-confirmed)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Only validate for email/password signups
  -- Check if this is actually an email/password signup by looking for encrypted_password
  IF NEW.encrypted_password IS NOT NULL AND LENGTH(NEW.encrypted_password) > 0 THEN
    -- Basic validation for email/password users
    IF LENGTH(NEW.encrypted_password) < 10 THEN
      RAISE EXCEPTION 'Password does not meet security requirements' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
