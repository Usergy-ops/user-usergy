
-- Create the user_otp_verification table that the auth-otp edge function expects
CREATE TABLE public.user_otp_verification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  blocked_until TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX idx_user_otp_verification_email ON public.user_otp_verification(email);
CREATE INDEX idx_user_otp_verification_expires_at ON public.user_otp_verification(expires_at);

-- Enable RLS
ALTER TABLE public.user_otp_verification ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage OTP verifications" 
  ON public.user_otp_verification 
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own OTP verifications" 
  ON public.user_otp_verification 
  FOR SELECT 
  USING (email = auth.email());
