
-- Create OTP verification table
CREATE TABLE IF NOT EXISTS public.user_otp_verification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE NULL,
  attempts INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_otp_email ON public.user_otp_verification(email);
CREATE INDEX IF NOT EXISTS idx_user_otp_expires ON public.user_otp_verification(expires_at);

-- Enable RLS
ALTER TABLE public.user_otp_verification ENABLE ROW LEVEL SECURITY;

-- Create policy for OTP verification - allowing service role to manage all operations
CREATE POLICY "Service role can manage OTP verifications" 
ON public.user_otp_verification 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create policy for users to read their own OTP records for verification
CREATE POLICY "Users can read their own OTP records" 
ON public.user_otp_verification 
FOR SELECT 
USING (email = auth.email());
