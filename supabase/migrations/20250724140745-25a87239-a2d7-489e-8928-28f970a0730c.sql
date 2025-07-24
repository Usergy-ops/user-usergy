
-- Add missing indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_completion_percentage ON public.profiles(completion_percentage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_tech_fluency_user_id ON public.user_tech_fluency(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_social_presence_user_id ON public.user_social_presence(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_otp_verification_email ON public.user_otp_verification(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_otp_verification_expires_at ON public.user_otp_verification(expires_at);

-- Add validation trigger for profile completion percentage
CREATE OR REPLACE FUNCTION validate_completion_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completion_percentage IS NOT NULL AND (NEW.completion_percentage < 0 OR NEW.completion_percentage > 100) THEN
    RAISE EXCEPTION 'Completion percentage must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_completion_percentage
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_completion_percentage();

-- Add validation trigger for age
CREATE OR REPLACE FUNCTION validate_age()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.age IS NOT NULL AND (NEW.age < 13 OR NEW.age > 120) THEN
    RAISE EXCEPTION 'Age must be between 13 and 120';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_age
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_age();

-- Add validation trigger for OTP expiration
CREATE OR REPLACE FUNCTION validate_otp_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at <= NOW() THEN
    RAISE EXCEPTION 'OTP expiration time must be in the future';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_otp_expiration
  BEFORE INSERT ON public.user_otp_verification
  FOR EACH ROW
  EXECUTE FUNCTION validate_otp_expiration();

-- Add constraint to ensure email format
ALTER TABLE public.profiles 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add constraint to ensure positive rate limit attempts
ALTER TABLE public.rate_limits 
ADD CONSTRAINT check_positive_attempts 
CHECK (attempts >= 0);

-- Add constraint to ensure coding experience years is reasonable
ALTER TABLE public.user_tech_fluency 
ADD CONSTRAINT check_coding_experience_years 
CHECK (coding_experience_years IS NULL OR (coding_experience_years >= 0 AND coding_experience_years <= 50));

-- Create function to clean up expired OTP records
CREATE OR REPLACE FUNCTION cleanup_expired_otp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_otp_verification 
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$;
