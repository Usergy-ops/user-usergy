
-- Create rate limiting table for tracking authentication attempts
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or IP address
  action TEXT NOT NULL, -- 'signin', 'signup', 'otp_verify', 'password_reset'
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits (identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits (window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access (for edge functions)
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_rate_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rate_limits_updated_at();

-- Update OTP verification table to track attempts and add security fields
ALTER TABLE public.user_otp_verification 
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP WITH TIME ZONE;

-- Create index for efficient OTP lookups
CREATE INDEX IF NOT EXISTS idx_user_otp_verification_email_expires ON public.user_otp_verification (email, expires_at);
