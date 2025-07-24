
-- Fix authentication flow issues and security hardening

-- 1. Create a secure trigger function for new user creation with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile with proper error handling
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_secure();

-- 3. Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_old_enhanced_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.enhanced_rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND resolved = TRUE;
END;
$$;

-- 4. Create function to check profile completion based on actual mandatory fields
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_row profiles%ROWTYPE;
  device_row user_devices%ROWTYPE;
  tech_row user_tech_fluency%ROWTYPE;
  total_fields INTEGER := 16; -- Updated to match frontend calculation
  completed_fields INTEGER := 0;
BEGIN
  -- Get profile data
  SELECT * INTO profile_row FROM public.profiles WHERE user_id = user_uuid;
  SELECT * INTO device_row FROM public.user_devices WHERE user_id = user_uuid;
  SELECT * INTO tech_row FROM public.user_tech_fluency WHERE user_id = user_uuid;
  
  -- Check Basic Profile fields (7 fields - phone_number is optional)
  IF profile_row.full_name IS NOT NULL AND profile_row.full_name != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF profile_row.avatar_url IS NOT NULL AND profile_row.avatar_url != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF profile_row.country IS NOT NULL AND profile_row.country != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF profile_row.city IS NOT NULL AND profile_row.city != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF profile_row.gender IS NOT NULL AND profile_row.gender != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF profile_row.age IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF profile_row.timezone IS NOT NULL AND profile_row.timezone != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Check Devices & Tech fields (4 fields)
  IF device_row.operating_systems IS NOT NULL AND array_length(device_row.operating_systems, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF device_row.devices_owned IS NOT NULL AND array_length(device_row.devices_owned, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF device_row.mobile_manufacturers IS NOT NULL AND array_length(device_row.mobile_manufacturers, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF device_row.email_clients IS NOT NULL AND array_length(device_row.email_clients, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Check Education & Work fields (1 field)
  IF profile_row.education_level IS NOT NULL AND profile_row.education_level != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Check AI & Tech Fluency fields (4 fields)
  IF profile_row.technical_experience_level IS NOT NULL AND profile_row.technical_experience_level != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF profile_row.ai_familiarity_level IS NOT NULL AND profile_row.ai_familiarity_level != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF tech_row.ai_models_used IS NOT NULL AND array_length(tech_row.ai_models_used, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF tech_row.ai_interests IS NOT NULL AND array_length(tech_row.ai_interests, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Return percentage
  RETURN ROUND((completed_fields::FLOAT / total_fields::FLOAT) * 100);
END;
$$;

-- 5. Create trigger to auto-update completion percentage
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_uuid UUID;
  completion_pct INTEGER;
BEGIN
  -- Get user_id from the modified row
  IF TG_TABLE_NAME = 'profiles' THEN
    user_uuid := COALESCE(NEW.user_id, OLD.user_id);
  ELSE
    user_uuid := COALESCE(NEW.user_id, OLD.user_id);
  END IF;
  
  -- Calculate new completion percentage
  completion_pct := public.calculate_profile_completion(user_uuid);
  
  -- Update profiles table
  UPDATE public.profiles 
  SET completion_percentage = completion_pct,
      updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for auto-updating completion percentage
DROP TRIGGER IF EXISTS update_completion_on_profile_change ON public.profiles;
CREATE TRIGGER update_completion_on_profile_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name OR
        OLD.avatar_url IS DISTINCT FROM NEW.avatar_url OR
        OLD.country IS DISTINCT FROM NEW.country OR
        OLD.city IS DISTINCT FROM NEW.city OR
        OLD.gender IS DISTINCT FROM NEW.gender OR
        OLD.age IS DISTINCT FROM NEW.age OR
        OLD.timezone IS DISTINCT FROM NEW.timezone OR
        OLD.education_level IS DISTINCT FROM NEW.education_level OR
        OLD.technical_experience_level IS DISTINCT FROM NEW.technical_experience_level OR
        OLD.ai_familiarity_level IS DISTINCT FROM NEW.ai_familiarity_level)
  EXECUTE FUNCTION public.update_profile_completion();

DROP TRIGGER IF EXISTS update_completion_on_devices_change ON public.user_devices;
CREATE TRIGGER update_completion_on_devices_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion();

DROP TRIGGER IF EXISTS update_completion_on_tech_change ON public.user_tech_fluency;
CREATE TRIGGER update_completion_on_tech_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_tech_fluency
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion();

-- 6. Add password strength validation (without exposing plaintext)
CREATE OR REPLACE FUNCTION public.validate_password_requirements(password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function validates that a password hash exists and is properly formatted
  -- The actual password validation should be done on the client side
  -- This is just a placeholder for future password policy enforcement
  RETURN password_hash IS NOT NULL AND LENGTH(password_hash) > 10;
END;
$$;
