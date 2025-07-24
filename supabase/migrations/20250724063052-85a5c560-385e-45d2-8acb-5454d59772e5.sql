
-- First, let's update the profile_data table to match the original field names
ALTER TABLE public.profile_data 
DROP COLUMN IF EXISTS full_name,
DROP COLUMN IF EXISTS profile_picture_url,
DROP COLUMN IF EXISTS location_country,
DROP COLUMN IF EXISTS location_city,
DROP COLUMN IF EXISTS contact_number,
DROP COLUMN IF EXISTS time_zone,
DROP COLUMN IF EXISTS current_job_title,
DROP COLUMN IF EXISTS current_employer,
DROP COLUMN IF EXISTS linkedin_profile,
DROP COLUMN IF EXISTS twitter_profile,
DROP COLUMN IF EXISTS github_profile,
DROP COLUMN IF EXISTS short_bio;

-- Add the correct original field names
ALTER TABLE public.profile_data 
ADD COLUMN full_name TEXT,
ADD COLUMN avatar_url TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN age INTEGER,
ADD COLUMN country TEXT,
ADD COLUMN city TEXT,
ADD COLUMN timezone TEXT,
ADD COLUMN job_title TEXT,
ADD COLUMN employer TEXT,
ADD COLUMN linkedin_url TEXT,
ADD COLUMN twitter_url TEXT,
ADD COLUMN github_url TEXT,
ADD COLUMN portfolio_url TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN interests TEXT[],
ADD COLUMN coding_experience_years INTEGER;

-- Update profiles table to include avatar_url
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create function to auto-calculate age from date_of_birth
CREATE OR REPLACE FUNCTION public.calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update age when date_of_birth changes
CREATE OR REPLACE FUNCTION public.update_age_from_birth_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.age := public.calculate_age(NEW.date_of_birth);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_age_trigger ON public.profile_data;
CREATE TRIGGER update_age_trigger
  BEFORE INSERT OR UPDATE ON public.profile_data
  FOR EACH ROW EXECUTE FUNCTION public.update_age_from_birth_date();

-- Update completion calculation function to use original field names
CREATE OR REPLACE FUNCTION public.calculate_completion_percentage(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_count INTEGER := 0;
  total_sections INTEGER := 6;
  completion_record RECORD;
  profile_record RECORD;
BEGIN
  -- Get completion status
  SELECT * INTO completion_record 
  FROM public.profile_completion pc 
  WHERE pc.user_id = calculate_completion_percentage.user_id;
  
  -- Get profile data
  SELECT * INTO profile_record 
  FROM public.profile_data pd 
  WHERE pd.user_id = calculate_completion_percentage.user_id;
  
  -- Check mandatory fields for each section
  -- Section 1: Basic Profile (full_name, avatar_url, country, city, gender, date_of_birth, timezone)
  IF profile_record.full_name IS NOT NULL 
     AND profile_record.avatar_url IS NOT NULL 
     AND profile_record.country IS NOT NULL 
     AND profile_record.city IS NOT NULL 
     AND profile_record.gender IS NOT NULL 
     AND profile_record.date_of_birth IS NOT NULL 
     AND profile_record.timezone IS NOT NULL THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Section 2: Devices (operating_systems, devices_owned, mobile_manufacturers, email_clients)
  IF profile_record.operating_systems IS NOT NULL 
     AND array_length(profile_record.operating_systems, 1) > 0
     AND profile_record.devices_owned IS NOT NULL 
     AND array_length(profile_record.devices_owned, 1) > 0
     AND profile_record.mobile_manufacturers IS NOT NULL 
     AND array_length(profile_record.mobile_manufacturers, 1) > 0
     AND profile_record.email_clients IS NOT NULL 
     AND array_length(profile_record.email_clients, 1) > 0 THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Section 3: Education (education_level)
  IF profile_record.education_level IS NOT NULL THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Section 4: Tech (technical_experience_level, ai_familiarity_level, ai_models_used, ai_interests)
  IF profile_record.technical_experience_level IS NOT NULL 
     AND profile_record.ai_familiarity_level IS NOT NULL
     AND profile_record.ai_models_used IS NOT NULL 
     AND array_length(profile_record.ai_models_used, 1) > 0
     AND profile_record.ai_interests IS NOT NULL 
     AND array_length(profile_record.ai_interests, 1) > 0 THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Section 5: Social Presence (at least one social profile)
  IF profile_record.linkedin_url IS NOT NULL 
     OR profile_record.twitter_url IS NOT NULL 
     OR profile_record.github_url IS NOT NULL 
     OR profile_record.portfolio_url IS NOT NULL THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Section 6: Skills & Interests (bio and interests)
  IF profile_record.bio IS NOT NULL 
     AND profile_record.interests IS NOT NULL 
     AND array_length(profile_record.interests, 1) > 0 THEN
    completion_count := completion_count + 1;
  END IF;
  
  RETURN (completion_count * 100) / total_sections;
END;
$$;
