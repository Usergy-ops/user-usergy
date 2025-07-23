
-- Create profile completion tracking table
CREATE TABLE public.profile_completion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  section_1_completed BOOLEAN DEFAULT false,
  section_2_completed BOOLEAN DEFAULT false,
  section_3_completed BOOLEAN DEFAULT false,
  section_4_completed BOOLEAN DEFAULT false,
  section_5_completed BOOLEAN DEFAULT false,
  section_6_completed BOOLEAN DEFAULT false,
  overall_completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create detailed profile data table
CREATE TABLE public.profile_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Section 1: Basic Info
  full_name TEXT,
  profile_picture_url TEXT,
  location_country TEXT,
  location_city TEXT,
  contact_number TEXT,
  date_of_birth DATE,
  gender TEXT,
  
  -- Section 2: Devices & Product Usage
  operating_systems TEXT[],
  devices_owned TEXT[],
  mobile_manufacturers TEXT[],
  desktop_manufacturers TEXT[],
  email_clients TEXT[],
  streaming_subscriptions TEXT[],
  music_subscriptions TEXT[],
  
  -- Section 3: Education & Work
  education_level TEXT,
  field_of_study TEXT,
  current_job_title TEXT,
  current_employer TEXT,
  industry TEXT,
  work_role TEXT,
  company_size TEXT,
  household_income_range TEXT,
  
  -- Section 4: AI & Tech Fluency
  technical_experience_level TEXT,
  ai_familiarity_level TEXT,
  ai_interests TEXT[],
  ai_models_used TEXT[],
  programming_languages JSONB, -- {language: proficiency_level}
  
  -- Section 5: Social Presence
  linkedin_profile TEXT,
  twitter_profile TEXT,
  github_profile TEXT,
  other_social_networks JSONB,
  additional_links TEXT[],
  
  -- Section 6: Skills & Interests
  specific_skills JSONB, -- {skill: proficiency_level}
  product_categories TEXT[],
  languages_spoken JSONB, -- {language: fluency_level}
  time_zone TEXT,
  availability JSONB, -- schedule data
  short_bio TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true);

-- Enable RLS on profile tables
ALTER TABLE public.profile_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profile_completion
CREATE POLICY "Users can view their own profile completion" 
  ON public.profile_completion 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile completion" 
  ON public.profile_completion 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile completion" 
  ON public.profile_completion 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for profile_data
CREATE POLICY "Users can view their own profile data" 
  ON public.profile_data 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile data" 
  ON public.profile_data 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile data" 
  ON public.profile_data 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create storage policies for profile pictures
CREATE POLICY "Users can upload their own profile pictures" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own profile pictures" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile pictures" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_completion_updated_at
  BEFORE UPDATE ON public.profile_completion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profile_data_updated_at
  BEFORE UPDATE ON public.profile_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate completion percentage
CREATE OR REPLACE FUNCTION public.calculate_completion_percentage(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion_count INTEGER := 0;
  total_sections INTEGER := 6;
  completion_record RECORD;
BEGIN
  SELECT * INTO completion_record 
  FROM public.profile_completion pc 
  WHERE pc.user_id = calculate_completion_percentage.user_id;
  
  IF completion_record.section_1_completed THEN completion_count := completion_count + 1; END IF;
  IF completion_record.section_2_completed THEN completion_count := completion_count + 1; END IF;
  IF completion_record.section_3_completed THEN completion_count := completion_count + 1; END IF;
  IF completion_record.section_4_completed THEN completion_count := completion_count + 1; END IF;
  IF completion_record.section_5_completed THEN completion_count := completion_count + 1; END IF;
  IF completion_record.section_6_completed THEN completion_count := completion_count + 1; END IF;
  
  RETURN (completion_count * 100) / total_sections;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the profiles table to track completion status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Create trigger to update profile completion percentage
CREATE OR REPLACE FUNCTION public.update_profile_completion_percentage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET profile_completion_percentage = public.calculate_completion_percentage(NEW.user_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_completion_percentage_trigger
  AFTER INSERT OR UPDATE ON public.profile_completion
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion_percentage();
