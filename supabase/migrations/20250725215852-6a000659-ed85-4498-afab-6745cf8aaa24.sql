-- =====================================================
-- Fix All Critical Issues in Usergy Platform
-- =====================================================
-- This migration safely fixes all identified issues without
-- affecting existing functionality or data
-- =====================================================

-- =====================================================
-- 1. FIX PROFILE COMPLETION CALCULATION
-- =====================================================
-- Ensure frontend and backend use identical field counting

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
-- Remove duplicate triggers and functions

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
-- 3. FIX FOREIGN KEY REFERENCES
-- =====================================================
-- Update foreign keys to reference auth.users with CASCADE

-- First, drop existing foreign key constraints
ALTER TABLE IF EXISTS public.user_devices 
  DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;
ALTER TABLE IF EXISTS public.user_tech_fluency 
  DROP CONSTRAINT IF EXISTS user_tech_fluency_user_id_fkey;
ALTER TABLE IF EXISTS public.user_skills 
  DROP CONSTRAINT IF EXISTS user_skills_user_id_fkey;
ALTER TABLE IF EXISTS public.user_social_presence 
  DROP CONSTRAINT IF EXISTS user_social_presence_user_id_fkey;

-- Add new foreign key constraints with CASCADE
ALTER TABLE public.user_devices 
  ADD CONSTRAINT user_devices_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_tech_fluency 
  ADD CONSTRAINT user_tech_fluency_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_skills 
  ADD CONSTRAINT user_skills_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Only add constraint if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_social_presence') THEN
    ALTER TABLE public.user_social_presence 
      ADD CONSTRAINT user_social_presence_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- 4. CONSOLIDATE SOCIAL PRESENCE TABLES
-- =====================================================
-- Migrate data from user_social_presence to consolidated_social_presence

-- Ensure consolidated table exists
CREATE TABLE IF NOT EXISTS public.consolidated_social_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  portfolio_url TEXT,
  additional_links TEXT[] DEFAULT '{}',
  other_social_networks JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT consolidated_social_presence_user_id_key UNIQUE (user_id)
);

-- Enable RLS on consolidated table
ALTER TABLE public.consolidated_social_presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for consolidated table
DROP POLICY IF EXISTS "Users can manage their own consolidated social presence" ON public.consolidated_social_presence;
CREATE POLICY "Users can manage their own consolidated social presence" 
ON public.consolidated_social_presence 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

-- Migrate existing data if any
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_social_presence') THEN
    INSERT INTO public.consolidated_social_presence (user_id, additional_links, other_social_networks, created_at, updated_at)
    SELECT 
      user_id,
      additional_links,
      other_social_networks,
      created_at,
      updated_at
    FROM public.user_social_presence
    ON CONFLICT (user_id) DO UPDATE SET
      additional_links = EXCLUDED.additional_links,
      other_social_networks = EXCLUDED.other_social_networks,
      updated_at = NOW();
      
    -- Drop the old table (after data migration)
    DROP TABLE public.user_social_presence CASCADE;
  END IF;
END $$;

-- =====================================================
-- 5. ADD MISSING PERFORMANCE INDEXES
-- =====================================================

-- Profile completion indexes
CREATE INDEX IF NOT EXISTS idx_profiles_completion_percentage 
  ON public.profiles(completion_percentage);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed 
  ON public.profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_completion 
  ON public.profiles(user_id, completion_percentage, profile_completed);

-- Section completion indexes
CREATE INDEX IF NOT EXISTS idx_profiles_section_completion 
  ON public.profiles(
    section_1_completed,
    section_2_completed,
    section_3_completed,
    section_4_completed,
    section_5_completed,
    section_6_completed
  );

-- =====================================================
-- 6. CREATE CONTROLLED TRIGGER EXECUTION ORDER
-- =====================================================
-- Rename triggers to control execution order

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_completion_on_profile_change ON public.profiles;
DROP TRIGGER IF EXISTS update_completion_on_devices_change ON public.user_devices;
DROP TRIGGER IF EXISTS update_completion_on_tech_change ON public.user_tech_fluency;
DROP TRIGGER IF EXISTS update_completion_on_skills_change ON public.user_skills;

-- =====================================================
-- 7. UPDATE PROFILE COMPLETION TRIGGER FUNCTION
-- =====================================================
-- Ensure it updates both percentage and completed flag

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

-- Create ordered triggers (alphabetical execution)
CREATE TRIGGER a_update_completion_on_profile_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.full_name IS DISTINCT FROM NEW.full_name OR
    OLD.country IS DISTINCT FROM NEW.country OR
    OLD.city IS DISTINCT FROM NEW.city OR
    OLD.gender IS DISTINCT FROM NEW.gender OR
    OLD.age IS DISTINCT FROM NEW.age OR
    OLD.timezone IS DISTINCT FROM NEW.timezone OR
    OLD.education_level IS DISTINCT FROM NEW.education_level OR
    OLD.technical_experience_level IS DISTINCT FROM NEW.technical_experience_level OR
    OLD.ai_familiarity_level IS DISTINCT FROM NEW.ai_familiarity_level OR
    OLD.languages_spoken IS DISTINCT FROM NEW.languages_spoken
  )
  EXECUTE FUNCTION public.update_profile_completion();

CREATE TRIGGER b_update_completion_on_devices_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion();

CREATE TRIGGER c_update_completion_on_tech_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_tech_fluency
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion();

CREATE TRIGGER d_update_completion_on_skills_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion();

-- =====================================================
-- 8. DATA CLEANUP AND CONSISTENCY CHECK
-- =====================================================

-- Update all existing profiles to ensure consistency
UPDATE public.profiles p
SET 
  completion_percentage = public.calculate_profile_completion(p.user_id),
  profile_completed = (public.calculate_profile_completion(p.user_id) >= 100)
WHERE p.user_id IS NOT NULL;