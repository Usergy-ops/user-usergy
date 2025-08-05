
-- Phase 1: Core Infrastructure Updates
-- Update error_logs table to support enhanced error tracking
ALTER TABLE public.error_logs 
ADD COLUMN IF NOT EXISTS severity text DEFAULT 'error',
ADD COLUMN IF NOT EXISTS component_name text,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS ip_address inet;

-- Create index for faster error log queries
CREATE INDEX IF NOT EXISTS idx_error_logs_user_context ON public.error_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type_severity ON public.error_logs(error_type, severity);

-- Phase 2: Rate Limiting Enhancement
-- Add escalation support to enhanced_rate_limits
ALTER TABLE public.enhanced_rate_limits
ADD COLUMN IF NOT EXISTS escalation_level integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_violations integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_violation_at timestamp with time zone;

-- Create function for progressive rate limiting
CREATE OR REPLACE FUNCTION public.apply_progressive_rate_limit(
  identifier_param text,
  action_param text,
  base_attempts integer DEFAULT 10,
  base_window_minutes integer DEFAULT 60
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_record record;
  escalation_multiplier numeric := 1.0;
  new_attempts integer;
  new_window_minutes integer;
  result jsonb;
BEGIN
  -- Get current rate limit record
  SELECT * INTO current_record
  FROM public.enhanced_rate_limits
  WHERE identifier = identifier_param AND action = action_param
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate escalation multiplier based on violation history
  IF current_record.total_violations IS NOT NULL THEN
    escalation_multiplier := 1.0 + (current_record.total_violations * 0.5);
  END IF;
  
  -- Apply progressive scaling
  new_attempts := GREATEST(1, FLOOR(base_attempts / escalation_multiplier));
  new_window_minutes := FLOOR(base_window_minutes * escalation_multiplier);
  
  RETURN jsonb_build_object(
    'max_attempts', new_attempts,
    'window_minutes', new_window_minutes,
    'escalation_level', COALESCE(current_record.escalation_level, 0),
    'total_violations', COALESCE(current_record.total_violations, 0)
  );
END;
$$;

-- Phase 3: Monitoring and Performance Tables
-- Create system_metrics table for monitoring
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_type text NOT NULL DEFAULT 'counter', -- counter, gauge, histogram
  labels jsonb DEFAULT '{}',
  user_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Create performance_logs table
CREATE TABLE IF NOT EXISTS public.performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name text NOT NULL,
  duration_ms integer NOT NULL,
  component_name text,
  user_id uuid,
  session_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for monitoring tables
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage system metrics" ON public.system_metrics
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own performance logs" ON public.performance_logs
FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage performance logs" ON public.performance_logs
FOR ALL USING (auth.role() = 'service_role');

-- Phase 4: User Schema Architecture Enhancement
-- Create user_sessions table for better session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text UNIQUE NOT NULL,
  device_info jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS for user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
FOR ALL USING (user_id = auth.uid());

-- Phase 5: Enhanced Cleanup Functions
CREATE OR REPLACE FUNCTION public.comprehensive_system_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_results jsonb := '{}';
  expired_sessions integer;
  old_metrics integer;
  old_performance_logs integer;
BEGIN
  -- Clean up expired sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR (last_activity < now() - INTERVAL '30 days');
  GET DIAGNOSTICS expired_sessions = ROW_COUNT;
  
  -- Clean up old system metrics (keep 30 days)
  DELETE FROM public.system_metrics 
  WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS old_metrics = ROW_COUNT;
  
  -- Clean up old performance logs (keep 7 days)
  DELETE FROM public.performance_logs 
  WHERE created_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS old_performance_logs = ROW_COUNT;
  
  -- Call existing cleanup functions
  PERFORM public.cleanup_expired_otp();
  PERFORM public.cleanup_old_rate_limits();
  PERFORM public.cleanup_old_enhanced_rate_limits();
  PERFORM public.cleanup_old_error_logs();
  
  cleanup_results := jsonb_build_object(
    'expired_sessions_cleaned', expired_sessions,
    'old_metrics_cleaned', old_metrics,
    'old_performance_logs_cleaned', old_performance_logs,
    'timestamp', now(),
    'success', true
  );
  
  -- Log cleanup results
  INSERT INTO public.error_logs (
    error_type, error_message, context, metadata
  ) VALUES (
    'info', 'System cleanup completed', 'comprehensive_system_cleanup', cleanup_results
  );
  
  RETURN cleanup_results;
END;
$$;

-- Phase 6: Profile completion enhancement
-- Update calculate_profile_completion function for better accuracy
CREATE OR REPLACE FUNCTION public.calculate_profile_completion_enhanced(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_row profiles%ROWTYPE;
  device_row user_devices%ROWTYPE;
  tech_row user_tech_fluency%ROWTYPE;
  skills_row user_skills%ROWTYPE;
  social_row consolidated_social_presence%ROWTYPE;
  
  completion_details jsonb := '{}';
  section_scores jsonb := '{}';
  total_score integer := 0;
  max_score integer := 100;
BEGIN
  -- Get all related data
  SELECT * INTO profile_row FROM public.profiles WHERE user_id = user_uuid;
  SELECT * INTO device_row FROM public.user_devices WHERE user_id = user_uuid;
  SELECT * INTO tech_row FROM public.user_tech_fluency WHERE user_id = user_uuid;
  SELECT * INTO skills_row FROM public.user_skills WHERE user_id = user_uuid;
  SELECT * INTO social_row FROM public.consolidated_social_presence WHERE user_id = user_uuid;
  
  -- Return early if no profile exists
  IF profile_row.user_id IS NULL THEN
    RETURN jsonb_build_object(
      'completion_percentage', 0,
      'is_complete', false,
      'missing_sections', '["basic_profile", "devices", "tech_fluency", "skills", "social_presence"]'::jsonb
    );
  END IF;
  
  -- Calculate section scores with detailed tracking
  -- Basic Profile (25 points)
  section_scores := section_scores || jsonb_build_object('basic_profile', 
    CASE WHEN profile_row.full_name IS NOT NULL AND profile_row.country IS NOT NULL 
         AND profile_row.city IS NOT NULL AND profile_row.timezone IS NOT NULL
    THEN 25 ELSE 0 END
  );
  
  -- Devices & Tech (20 points)
  section_scores := section_scores || jsonb_build_object('devices',
    CASE WHEN device_row.user_id IS NOT NULL 
         AND array_length(device_row.operating_systems, 1) > 0
         AND array_length(device_row.devices_owned, 1) > 0
    THEN 20 ELSE 0 END
  );
  
  -- Tech Fluency (25 points)
  section_scores := section_scores || jsonb_build_object('tech_fluency',
    CASE WHEN tech_row.user_id IS NOT NULL 
         AND array_length(tech_row.ai_models_used, 1) > 0
         AND profile_row.ai_familiarity_level IS NOT NULL
    THEN 25 ELSE 0 END
  );
  
  -- Skills & Interests (15 points)
  section_scores := section_scores || jsonb_build_object('skills',
    CASE WHEN skills_row.user_id IS NOT NULL 
         AND array_length(skills_row.interests, 1) > 0
    THEN 15 ELSE 0 END
  );
  
  -- Social Presence (15 points)
  section_scores := section_scores || jsonb_build_object('social_presence',
    CASE WHEN social_row.user_id IS NOT NULL 
         AND (social_row.linkedin_url IS NOT NULL OR social_row.github_url IS NOT NULL)
    THEN 15 ELSE 0 END
  );
  
  -- Calculate total score
  total_score := (section_scores->>'basic_profile')::integer + 
                 (section_scores->>'devices')::integer +
                 (section_scores->>'tech_fluency')::integer +
                 (section_scores->>'skills')::integer +
                 (section_scores->>'social_presence')::integer;
  
  RETURN jsonb_build_object(
    'completion_percentage', total_score,
    'is_complete', total_score >= 80, -- 80% threshold for completion
    'section_scores', section_scores,
    'total_score', total_score,
    'max_score', max_score,
    'last_calculated', now()
  );
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON public.system_metrics(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_operation ON public.performance_logs(operation_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active, last_activity);
CREATE INDEX IF NOT EXISTS idx_enhanced_rate_limits_escalation ON public.enhanced_rate_limits(identifier, action, escalation_level);

-- Create trigger to update profile completion automatically
CREATE OR REPLACE FUNCTION public.trigger_profile_completion_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_result jsonb;
BEGIN
  -- Calculate enhanced completion
  completion_result := public.calculate_profile_completion_enhanced(COALESCE(NEW.user_id, OLD.user_id));
  
  -- Update profiles table
  UPDATE public.profiles 
  SET 
    completion_percentage = (completion_result->>'completion_percentage')::integer,
    profile_completed = (completion_result->>'is_complete')::boolean,
    updated_at = now()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply trigger to all relevant tables
DROP TRIGGER IF EXISTS trigger_profile_completion_profiles ON public.profiles;
CREATE TRIGGER trigger_profile_completion_profiles
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_completion_update();

DROP TRIGGER IF EXISTS trigger_profile_completion_devices ON public.user_devices;
CREATE TRIGGER trigger_profile_completion_devices
AFTER INSERT OR UPDATE OR DELETE ON public.user_devices
FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_completion_update();

DROP TRIGGER IF EXISTS trigger_profile_completion_tech ON public.user_tech_fluency;
CREATE TRIGGER trigger_profile_completion_tech
AFTER INSERT OR UPDATE OR DELETE ON public.user_tech_fluency
FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_completion_update();

DROP TRIGGER IF EXISTS trigger_profile_completion_skills ON public.user_skills;
CREATE TRIGGER trigger_profile_completion_skills
AFTER INSERT OR UPDATE OR DELETE ON public.user_skills
FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_completion_update();

DROP TRIGGER IF EXISTS trigger_profile_completion_social ON public.consolidated_social_presence;
CREATE TRIGGER trigger_profile_completion_social
AFTER INSERT OR UPDATE OR DELETE ON public.consolidated_social_presence
FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_completion_update();
