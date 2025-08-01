
-- Ensure auth_otp_verifications table exists with proper structure
CREATE TABLE IF NOT EXISTS public.auth_otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  source_url TEXT,
  account_type TEXT DEFAULT 'client',
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_otp_email ON public.auth_otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_auth_otp_code ON public.auth_otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_auth_otp_expires ON public.auth_otp_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.auth_otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access (edge functions)
CREATE POLICY IF NOT EXISTS "Service role can manage OTP verifications" ON public.auth_otp_verifications
  FOR ALL USING (true);
