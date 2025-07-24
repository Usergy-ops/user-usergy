-- First, let's add all the new fields to the existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS field_of_study TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employer TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_income_range TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS technical_experience_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_familiarity_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_hours TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages_spoken TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section_1_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section_2_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section_3_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section_4_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section_5_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section_6_completed BOOLEAN DEFAULT FALSE;

-- Create table for user devices and tech stack
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  operating_systems TEXT[],
  devices_owned TEXT[],
  mobile_manufacturers TEXT[],
  desktop_manufacturers TEXT[],
  email_clients TEXT[],
  streaming_subscriptions TEXT[],
  music_subscriptions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for AI and tech fluency
CREATE TABLE IF NOT EXISTS public.user_tech_fluency (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ai_interests TEXT[],
  ai_models_used TEXT[],
  programming_languages JSONB, -- Store language name and proficiency level
  coding_experience_years INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for skills and interests
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  skills JSONB, -- Store skill name and proficiency level
  interests TEXT[],
  product_categories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for social presence
CREATE TABLE IF NOT EXISTS public.user_social_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  other_social_networks JSONB, -- Store platform name and URL
  additional_links TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tech_fluency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_devices
CREATE POLICY "Users can view their own devices" ON public.user_devices
  FOR SELECT USING (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own devices" ON public.user_devices
  FOR INSERT WITH CHECK (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own devices" ON public.user_devices
  FOR UPDATE USING (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for user_tech_fluency
CREATE POLICY "Users can view their own tech fluency" ON public.user_tech_fluency
  FOR SELECT USING (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own tech fluency" ON public.user_tech_fluency
  FOR INSERT WITH CHECK (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own tech fluency" ON public.user_tech_fluency
  FOR UPDATE USING (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for user_skills
CREATE POLICY "Users can view their own skills" ON public.user_skills
  FOR SELECT USING (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own skills" ON public.user_skills
  FOR INSERT WITH CHECK (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own skills" ON public.user_skills
  FOR UPDATE USING (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for user_social_presence
CREATE POLICY "Users can view their own social presence" ON public.user_social_presence
  FOR SELECT USING (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own social presence" ON public.user_social_presence
  FOR INSERT WITH CHECK (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own social presence" ON public.user_social_presence
  FOR UPDATE USING (user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_devices_updated_at
  BEFORE UPDATE ON public.user_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_tech_fluency_updated_at
  BEFORE UPDATE ON public.user_tech_fluency
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_social_presence_updated_at
  BEFORE UPDATE ON public.user_social_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile pictures
CREATE POLICY "Users can upload their own profile picture" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile picture" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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