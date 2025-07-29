
-- Phase 1: Critical Database Security Fixes

-- 1. Add missing RLS policies for tables that have RLS enabled but no policies

-- Fix consolidated_social_presence table - add missing policies
CREATE POLICY "Users can view their own consolidated social presence"
  ON public.consolidated_social_presence
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own consolidated social presence"
  ON public.consolidated_social_presence
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own consolidated social presence"
  ON public.consolidated_social_presence
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own consolidated social presence"
  ON public.consolidated_social_presence
  FOR DELETE
  USING (user_id = auth.uid());

-- Fix user_social_presence table - add missing policies
CREATE POLICY "Users can view their own social presence"
  ON public.user_social_presence
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own social presence"
  ON public.user_social_presence
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own social presence"
  ON public.user_social_presence
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own social presence"
  ON public.user_social_presence
  FOR DELETE
  USING (user_id = auth.uid());

-- 2. Fix database function security by setting explicit search paths
-- Update all security definer functions to use explicit schema paths

CREATE OR REPLACE FUNCTION public.diagnose_user_account(user_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result jsonb;
  user_record record;
  account_type_record record;
  profile_record record;
BEGIN
  -- Get user info
  SELECT * INTO user_record FROM auth.users WHERE id = user_id_param;
  
  -- Get account type info
  SELECT * INTO account_type_record FROM public.account_types 
  WHERE auth_user_id = user_id_param;
  
  -- Get profile info
  SELECT * INTO profile_record FROM client_workspace.company_profiles 
  WHERE auth_user_id = user_id_param;
  
  result := jsonb_build_object(
    'user_exists', user_record.id IS NOT NULL,
    'user_email', user_record.email,
    'user_provider', user_record.raw_app_meta_data->>'provider',
    'account_type_exists', account_type_record.auth_user_id IS NOT NULL,
    'account_type', account_type_record.account_type,
    'profile_exists', profile_record.auth_user_id IS NOT NULL,
    'profile_company', profile_record.company_name,
    'is_client_account_result', public.is_client_account(user_id_param)
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_client_account(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.account_types 
    WHERE auth_user_id = user_id_param 
    AND account_type = 'client'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_user_account(user_id_param uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.account_types 
    WHERE auth_user_id = user_id_param 
    AND account_type = 'user'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_account_type(user_id_param uuid DEFAULT auth.uid())
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  account_type_result text;
BEGIN
  SELECT account_type INTO account_type_result
  FROM public.account_types 
  WHERE auth_user_id = user_id_param;
  
  RETURN COALESCE(account_type_result, 'unknown');
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_uuid uuid, user_email text, user_full_name text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Insert profile if it doesn't exist
  INSERT INTO public.profiles (user_id, email, full_name, completion_percentage)
  VALUES (
    user_uuid, 
    user_email,
    COALESCE(user_full_name, 'User'),
    0
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      context,
      user_id,
      metadata
    ) VALUES (
      'profile_creation_error',
      SQLERRM,
      'ensure_profile_exists',
      user_uuid,
      jsonb_build_object(
        'email', user_email,
        'full_name', user_full_name
      )
    );
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_user_has_account_type(user_id_param uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  user_record record;
  account_type_exists boolean;
BEGIN
  -- Check if account type exists
  SELECT EXISTS(
    SELECT 1 FROM public.account_types 
    WHERE auth_user_id = user_id_param
  ) INTO account_type_exists;
  
  -- If account type doesn't exist, assign it
  IF NOT account_type_exists THEN
    -- Get user email
    SELECT id, email INTO user_record FROM auth.users WHERE id = user_id_param;
    
    IF user_record.id IS NOT NULL THEN
      -- Assign account type based on domain
      PERFORM public.assign_account_type_by_domain(user_record.id, user_record.email);
      
      -- Log the automatic assignment
      INSERT INTO public.error_logs (
        error_type,
        error_message,
        context,
        user_id,
        metadata
      ) VALUES (
        'info',
        'Account type automatically assigned during validation',
        'ensure_user_has_account_type',
        user_id_param,
        jsonb_build_object(
          'email', user_record.email,
          'trigger', 'profile_operation'
        )
      );
      
      RETURN TRUE;
    END IF;
    
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- 3. Add comprehensive audit logging for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can access audit logs
CREATE POLICY "Service role can manage security audit logs"
  ON public.security_audit_log
  FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_data,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_data,
    p_ip_address,
    p_user_agent
  );
END;
$$;

-- 5. Update rate limiting tables to include security metadata
ALTER TABLE public.rate_limits 
ADD COLUMN IF NOT EXISTS security_level TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS threat_detected BOOLEAN DEFAULT FALSE;

ALTER TABLE public.enhanced_rate_limits 
ADD COLUMN IF NOT EXISTS security_level TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS threat_detected BOOLEAN DEFAULT FALSE;

-- 6. Create function to validate password strength in database
CREATE OR REPLACE FUNCTION public.validate_password_security(password_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  issues text[] := '{}';
  score integer := 0;
BEGIN
  -- Check minimum length (12 characters)
  IF LENGTH(password_text) < 12 THEN
    issues := array_append(issues, 'Password must be at least 12 characters long');
  ELSE
    score := score + 2;
  END IF;
  
  -- Check for uppercase letter
  IF password_text !~ '[A-Z]' THEN
    issues := array_append(issues, 'Password must contain at least one uppercase letter');
  ELSE
    score := score + 1;
  END IF;
  
  -- Check for lowercase letter
  IF password_text !~ '[a-z]' THEN
    issues := array_append(issues, 'Password must contain at least one lowercase letter');
  ELSE
    score := score + 1;
  END IF;
  
  -- Check for digit
  IF password_text !~ '[0-9]' THEN
    issues := array_append(issues, 'Password must contain at least one number');
  ELSE
    score := score + 1;
  END IF;
  
  -- Check for special character
  IF password_text !~ '[@$!%*?&]' THEN
    issues := array_append(issues, 'Password must contain at least one special character (@$!%*?&)');
  ELSE
    score := score + 1;
  END IF;
  
  -- Check for common patterns
  IF password_text ~* '(password|123456|qwerty|admin|welcome)' THEN
    issues := array_append(issues, 'Password contains common weak patterns');
    score := score - 2;
  END IF;
  
  -- Ensure score doesn't go negative
  score := GREATEST(score, 0);
  
  RETURN jsonb_build_object(
    'is_valid', array_length(issues, 1) IS NULL,
    'score', score,
    'max_score', 6,
    'issues', issues,
    'strength', CASE 
      WHEN score >= 5 THEN 'strong'
      WHEN score >= 3 THEN 'medium'
      ELSE 'weak'
    END
  );
END;
$function$;
