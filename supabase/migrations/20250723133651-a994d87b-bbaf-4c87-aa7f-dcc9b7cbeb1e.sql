-- Fix the security issue with the function search path
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completion_score INTEGER := 0;
  total_fields INTEGER := 100; -- Total possible completion percentage
BEGIN
  -- Check profiles table completions
  SELECT 
    CASE WHEN p.full_name IS NOT NULL AND LENGTH(TRIM(p.full_name)) > 0 THEN 10 ELSE 0 END +
    CASE WHEN p.avatar_url IS NOT NULL AND LENGTH(TRIM(p.avatar_url)) > 0 THEN 10 ELSE 0 END +
    CASE WHEN p.phone_number IS NOT NULL AND LENGTH(TRIM(p.phone_number)) > 0 THEN 5 ELSE 0 END +
    CASE WHEN p.date_of_birth IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN p.country IS NOT NULL AND LENGTH(TRIM(p.country)) > 0 THEN 5 ELSE 0 END +
    CASE WHEN p.city IS NOT NULL AND LENGTH(TRIM(p.city)) > 0 THEN 5 ELSE 0 END +
    CASE WHEN p.education_level IS NOT NULL AND LENGTH(TRIM(p.education_level)) > 0 THEN 5 ELSE 0 END +
    CASE WHEN p.job_title IS NOT NULL AND LENGTH(TRIM(p.job_title)) > 0 THEN 5 ELSE 0 END +
    CASE WHEN p.industry IS NOT NULL AND LENGTH(TRIM(p.industry)) > 0 THEN 5 ELSE 0 END +
    CASE WHEN p.technical_experience_level IS NOT NULL AND LENGTH(TRIM(p.technical_experience_level)) > 0 THEN 5 ELSE 0 END +
    CASE WHEN p.ai_familiarity_level IS NOT NULL AND LENGTH(TRIM(p.ai_familiarity_level)) > 0 THEN 5 ELSE 0 END +
    CASE WHEN p.bio IS NOT NULL AND LENGTH(TRIM(p.bio)) > 10 THEN 10 ELSE 0 END +
    CASE WHEN p.linkedin_url IS NOT NULL AND LENGTH(TRIM(p.linkedin_url)) > 0 THEN 5 ELSE 0 END +
    CASE WHEN p.languages_spoken IS NOT NULL AND array_length(p.languages_spoken, 1) > 0 THEN 5 ELSE 0 END
  INTO completion_score
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
  
  -- Add device information completion
  IF EXISTS (SELECT 1 FROM public.user_devices WHERE user_id = profile_user_id) THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Add tech fluency completion
  IF EXISTS (SELECT 1 FROM public.user_tech_fluency WHERE user_id = profile_user_id) THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Add skills completion
  IF EXISTS (SELECT 1 FROM public.user_skills WHERE user_id = profile_user_id) THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Add social presence completion
  IF EXISTS (SELECT 1 FROM public.user_social_presence WHERE user_id = profile_user_id) THEN
    completion_score := completion_score + 5;
  END IF;
  
  RETURN LEAST(completion_score, 100);
END;
$$;