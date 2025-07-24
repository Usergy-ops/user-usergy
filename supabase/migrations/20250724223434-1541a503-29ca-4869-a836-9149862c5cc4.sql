
-- Fix RLS policies for error logging tables to allow public access for error logging
DROP POLICY IF EXISTS "Service role can manage error logs" ON public.error_logs;
CREATE POLICY "Allow error logging for authenticated and anonymous users" 
  ON public.error_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Also allow service role to manage for cleanup
CREATE POLICY "Service role can manage error logs" 
  ON public.error_logs 
  FOR ALL 
  USING (auth.role() = 'service_role'::text);

-- Fix RLS policies for rate limiting tables
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
CREATE POLICY "Allow rate limit checking for all users" 
  ON public.rate_limits 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow rate limit insertion for all users" 
  ON public.rate_limits 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service role can manage rate limits" 
  ON public.rate_limits 
  FOR ALL 
  USING (auth.role() = 'service_role'::text);

-- Fix enhanced rate limits table
DROP POLICY IF EXISTS "Service role can manage enhanced rate limits" ON public.enhanced_rate_limits;
CREATE POLICY "Allow enhanced rate limit checking for all users" 
  ON public.enhanced_rate_limits 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow enhanced rate limit insertion for all users" 
  ON public.enhanced_rate_limits 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service role can manage enhanced rate limits" 
  ON public.enhanced_rate_limits 
  FOR ALL 
  USING (auth.role() = 'service_role'::text);

-- Update the profile completion calculation function to handle missing related table data
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(user_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_row profiles%ROWTYPE;
  device_row user_devices%ROWTYPE;
  tech_row user_tech_fluency%ROWTYPE;
  skills_row user_skills%ROWTYPE;
  total_fields INTEGER := 17;
  completed_fields INTEGER := 0;
BEGIN
  -- Get profile data
  SELECT * INTO profile_row FROM public.profiles WHERE user_id = user_uuid;
  
  -- If profile doesn't exist, return 0
  IF profile_row.user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get related data with NULL handling
  SELECT * INTO device_row FROM public.user_devices WHERE user_id = user_uuid;
  SELECT * INTO tech_row FROM public.user_tech_fluency WHERE user_id = user_uuid;
  SELECT * INTO skills_row FROM public.user_skills WHERE user_id = user_uuid;
  
  -- Check Basic Profile fields (6 fields)
  IF profile_row.full_name IS NOT NULL AND profile_row.full_name != '' THEN
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
  
  -- Check Devices & Tech fields (4 fields) - handle NULL device_row
  IF device_row.user_id IS NOT NULL THEN
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
  END IF;
  
  -- Check Education & Work fields (1 field)
  IF profile_row.education_level IS NOT NULL AND profile_row.education_level != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Check AI & Tech Fluency fields (4 fields) - handle NULL tech_row
  IF profile_row.technical_experience_level IS NOT NULL AND profile_row.technical_experience_level != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF profile_row.ai_familiarity_level IS NOT NULL AND profile_row.ai_familiarity_level != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF tech_row.user_id IS NOT NULL THEN
    IF tech_row.ai_models_used IS NOT NULL AND array_length(tech_row.ai_models_used, 1) > 0 THEN
      completed_fields := completed_fields + 1;
    END IF;
    IF tech_row.ai_interests IS NOT NULL AND array_length(tech_row.ai_interests, 1) > 0 THEN
      completed_fields := completed_fields + 1;
    END IF;
  END IF;
  
  -- Check Skills & Interests fields (2 fields) - handle NULL skills_row
  IF skills_row.user_id IS NOT NULL THEN
    IF skills_row.interests IS NOT NULL AND array_length(skills_row.interests, 1) > 0 THEN
      completed_fields := completed_fields + 1;
    END IF;
  END IF;
  IF profile_row.languages_spoken IS NOT NULL AND array_length(profile_row.languages_spoken, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Return percentage
  RETURN ROUND((completed_fields::FLOAT / total_fields::FLOAT) * 100);
END;
$function$
