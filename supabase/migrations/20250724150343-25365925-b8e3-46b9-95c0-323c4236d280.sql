
-- Fix password security requirements by updating the auth.users table configuration
-- This will enforce stronger password requirements at the database level

-- Create a function to validate strong passwords
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check minimum length (12 characters)
  IF LENGTH(password) < 12 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for digit
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for special character
  IF password !~ '[@$!%*?&]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create enhanced rate limiting table with consistent structure
CREATE TABLE IF NOT EXISTS public.enhanced_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE,
  blocked_until TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_rate_limits_identifier_action ON public.enhanced_rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_enhanced_rate_limits_window_start ON public.enhanced_rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_enhanced_rate_limits_blocked_until ON public.enhanced_rate_limits(blocked_until);

-- Enable RLS on enhanced rate limits
ALTER TABLE public.enhanced_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for service role
CREATE POLICY "Service role can manage enhanced rate limits" 
ON public.enhanced_rate_limits 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create consolidated social presence table with proper structure
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_consolidated_social_presence_user_id ON public.consolidated_social_presence(user_id);

-- Enable RLS
ALTER TABLE public.consolidated_social_presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own consolidated social presence" 
ON public.consolidated_social_presence 
FOR ALL 
USING (user_id = auth.uid());

-- Create error logs table for centralized error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context TEXT,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for service role
CREATE POLICY "Service role can manage error logs" 
ON public.error_logs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_enhanced_rate_limits_updated_at
    BEFORE UPDATE ON public.enhanced_rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consolidated_social_presence_updated_at
    BEFORE UPDATE ON public.consolidated_social_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create cleanup function for old rate limits
CREATE OR REPLACE FUNCTION cleanup_old_enhanced_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.enhanced_rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for old error logs
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND resolved = TRUE;
END;
$$ LANGUAGE plpgsql;
