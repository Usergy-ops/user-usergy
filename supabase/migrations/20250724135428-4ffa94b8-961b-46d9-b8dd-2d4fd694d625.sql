
-- 1. Create the missing trigger for profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Fix RLS policy recursion issues by creating security definer functions
CREATE OR REPLACE FUNCTION public.get_user_profile_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT user_id FROM public.profiles WHERE user_id = user_uuid;
$$;

-- 3. Update RLS policies to use the security definer function
DROP POLICY IF EXISTS "Users can manage their own devices" ON public.user_devices;
CREATE POLICY "Users can manage their own devices" 
ON public.user_devices 
FOR ALL 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own tech fluency" ON public.user_tech_fluency;
CREATE POLICY "Users can manage their own tech fluency" 
ON public.user_tech_fluency 
FOR ALL 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own skills" ON public.user_skills;
CREATE POLICY "Users can manage their own skills" 
ON public.user_skills 
FOR ALL 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own social presence" ON public.user_social_presence;
CREATE POLICY "Users can manage their own social presence" 
ON public.user_social_presence 
FOR ALL 
USING (user_id = auth.uid());

-- 4. Fix function search paths for security
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.cleanup_rate_limits() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.update_rate_limits_updated_at() SET search_path = 'public';
ALTER FUNCTION public.get_user_profile_id(uuid) SET search_path = 'public';
