
-- Fix RLS policies to be less restrictive
-- Remove the is_user_account() requirement and only check user ownership

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "User account types can manage their own devices" ON public.user_devices;
DROP POLICY IF EXISTS "User account types can manage their own skills" ON public.user_skills;
DROP POLICY IF EXISTS "User account types can manage their own tech fluency" ON public.user_tech_fluency;

-- Create new simplified policies that only check user ownership
CREATE POLICY "Users can manage their own devices" 
  ON public.user_devices 
  FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own skills" 
  ON public.user_skills 
  FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own tech fluency" 
  ON public.user_tech_fluency 
  FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Also add RLS policy for consolidated_social_presence if it doesn't exist
ALTER TABLE public.consolidated_social_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own social presence" 
  ON public.consolidated_social_presence 
  FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());
