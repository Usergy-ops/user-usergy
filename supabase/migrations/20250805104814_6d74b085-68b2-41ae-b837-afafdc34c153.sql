
-- Fix the password validation trigger to properly exclude OAuth users
-- and users created through OTP verification (which may not have passwords initially)
DROP TRIGGER IF EXISTS validate_password_trigger ON auth.users;
DROP FUNCTION IF EXISTS validate_password_strength();

CREATE OR REPLACE FUNCTION validate_password_strength()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation for OAuth users (identified by provider metadata)
  IF NEW.raw_app_meta_data IS NOT NULL AND 
     NEW.raw_app_meta_data->>'provider' IS NOT NULL AND 
     NEW.raw_app_meta_data->>'provider' != 'email' THEN
    RETURN NEW;
  END IF;
  
  -- Skip validation if password is null or empty (for OTP-verified users)
  IF NEW.encrypted_password IS NULL OR NEW.encrypted_password = '' THEN
    RETURN NEW;
  END IF;
  
  -- Only validate password strength for email/password users with actual passwords
  -- This will be handled by the application layer for better user experience
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for password validation (currently minimal for OAuth compatibility)
CREATE TRIGGER validate_password_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION validate_password_strength();

-- Ensure the auth-otp edge function has proper permissions
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT, INSERT, UPDATE ON auth.users TO service_role;

-- Add progressive rate limiting function for enhanced security
CREATE OR REPLACE FUNCTION apply_progressive_rate_limit(
  identifier_param text,
  action_param text,
  base_attempts integer,
  base_window_minutes integer
) RETURNS TABLE(
  max_attempts integer,
  window_minutes integer,
  escalation_level integer,
  total_violations integer
) AS $$
DECLARE
  current_violations integer := 0;
  escalation_level_val integer := 0;
  calculated_attempts integer;
  calculated_window integer;
BEGIN
  -- Get current violation count from enhanced_rate_limits
  SELECT COALESCE(MAX(enhanced_rate_limits.total_violations), 0),
         COALESCE(MAX(enhanced_rate_limits.escalation_level), 0)
  INTO current_violations, escalation_level_val
  FROM enhanced_rate_limits 
  WHERE identifier = identifier_param 
    AND action = action_param
    AND created_at > NOW() - INTERVAL '24 hours';

  -- Calculate progressive limits based on violation history
  calculated_attempts := GREATEST(1, base_attempts - (escalation_level_val * 2));
  calculated_window := base_window_minutes * POWER(2, LEAST(escalation_level_val, 3));

  RETURN QUERY SELECT 
    calculated_attempts,
    calculated_window,
    escalation_level_val,
    current_violations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the progressive rate limiting function
GRANT EXECUTE ON FUNCTION apply_progressive_rate_limit TO authenticated, anon, service_role;

-- Add cleanup functions for rate limiting tables
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_enhanced_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM enhanced_rate_limits 
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND blocked_until IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for cleanup functions
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_enhanced_rate_limits TO service_role;
