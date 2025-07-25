-- =====================================================
-- Fix All Critical Issues in Usergy Platform (Part 1)
-- =====================================================
-- This migration safely fixes the most critical issues

-- =====================================================
-- 1. FIX PROFILE COMPLETION CALCULATION
-- =====================================================
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
  total_fields INTEGER := 17; -- Matching frontend exactly
  completed_fields INTEGER := 0;
BEGIN
  -- Get profile data with null safety
  SELECT * INTO profile_row FROM public.profiles WHERE user_id = user_uuid;
  
  IF profile_row.user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get related data safely
  SELECT * INTO device_row FROM public.user_devices WHERE user_id = user_uuid;
  SELECT * INTO tech_row FROM public.user_tech_fluency WHERE user_id = user_uuid;
  SELECT * INTO skills_row FROM public.user_skills WHERE user_id = user_uuid;
  
  -- Basic Profile (6 fields) - matching frontend exactly
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
  
  -- Devices & Tech (4 fields)
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
  
  -- Education & Work (1 field)
  IF profile_row.education_level IS NOT NULL AND profile_row.education_level != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- AI & Tech Fluency (4 fields)
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
  
  -- Skills & Interests (2 fields)
  IF skills_row.user_id IS NOT NULL THEN
    IF skills_row.interests IS NOT NULL AND array_length(skills_row.interests, 1) > 0 THEN
      completed_fields := completed_fields + 1;
    END IF;
  END IF;
  IF profile_row.languages_spoken IS NOT NULL AND array_length(profile_row.languages_spoken, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Calculate percentage
  RETURN ROUND((completed_fields::NUMERIC / total_fields::NUMERIC) * 100);
END;
$function$;

-- =====================================================
-- 2. FIX USER CREATION TRIGGER CONFLICTS
-- =====================================================
-- Drop all existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop old function if exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Keep only the secure version
CREATE OR REPLACE FUNCTION public.handle_new_user_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile with proper error handling
  INSERT INTO public.profiles (user_id, email, full_name, completion_percentage)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    0 -- Start with 0% completion
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate errors
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create single trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_secure();

-- =====================================================
-- 3. UPDATE PROFILE COMPLETION TRIGGER FUNCTION
-- =====================================================
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
  
  -- Update profiles table with both percentage and completed flag
  UPDATE public.profiles 
  SET 
    completion_percentage = completion_pct,
    profile_completed = (completion_pct >= 100),
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- 4. ADD MISSING PERFORMANCE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_completion_percentage 
  ON public.profiles(completion_percentage);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed 
  ON public.profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_completion 
  ON public.profiles(user_id, completion_percentage, profile_completed);

-- =====================================================
-- 5. DATA CLEANUP AND CONSISTENCY CHECK
-- =====================================================
-- Update all existing profiles to ensure consistency
UPDATE public.profiles p
SET 
  completion_percentage = public.calculate_profile_completion(p.user_id),
  profile_completed = (public.calculate_profile_completion(p.user_id) >= 100)
WHERE p.user_id IS NOT NULL;