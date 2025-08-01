
-- Add comprehensive logging for email sending attempts
CREATE TABLE IF NOT EXISTS public.email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'otp_verification', 'welcome', etc.
  status TEXT NOT NULL, -- 'success', 'failed', 'retrying'
  error_message TEXT,
  resend_response JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS for email logs
ALTER TABLE public.email_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage email logs"
  ON public.email_send_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Enhanced OTP verification table with better tracking
ALTER TABLE public.user_otp_verification 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_error TEXT,
ADD COLUMN IF NOT EXISTS resend_attempts INTEGER DEFAULT 0;

-- Add function to manually assign account type (for testing/admin use)
CREATE OR REPLACE FUNCTION public.manually_assign_account_type(
  user_id_param UUID,
  account_type_param TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate account type
  IF account_type_param NOT IN ('user', 'client') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid account type. Must be user or client.'
    );
  END IF;

  -- Insert or update account type
  INSERT INTO public.account_types (auth_user_id, account_type)
  VALUES (user_id_param, account_type_param)
  ON CONFLICT (auth_user_id) 
  DO UPDATE SET 
    account_type = account_type_param,
    created_at = CURRENT_TIMESTAMP;

  -- Log the manual assignment
  INSERT INTO public.error_logs (
    user_id,
    error_type,
    error_message,
    context,
    metadata
  ) VALUES (
    user_id_param,
    'account_type_manual_assignment',
    'Account type manually assigned',
    'manually_assign_account_type',
    jsonb_build_object(
      'account_type', account_type_param,
      'assigned_by', 'manual_function'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'account_type', account_type_param,
    'message', 'Account type assigned successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Add function to get comprehensive user status for debugging
CREATE OR REPLACE FUNCTION public.get_user_debug_info(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_info JSONB;
  auth_info JSONB;
  account_type_info JSONB;
  otp_info JSONB;
  profile_info JSONB;
BEGIN
  -- Get auth user info
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'email_confirmed_at', email_confirmed_at,
    'created_at', created_at,
    'last_sign_in_at', last_sign_in_at,
    'user_metadata', raw_user_meta_data
  ) INTO auth_info
  FROM auth.users 
  WHERE id = user_id_param;

  -- Get account type info
  SELECT jsonb_build_object(
    'account_type', account_type,
    'created_at', created_at
  ) INTO account_type_info
  FROM public.account_types 
  WHERE auth_user_id = user_id_param;

  -- Get latest OTP info
  SELECT jsonb_build_object(
    'email', email,
    'created_at', created_at,
    'expires_at', expires_at,
    'verified_at', verified_at,
    'attempts', attempts,
    'email_sent', email_sent,
    'email_error', email_error,
    'blocked_until', blocked_until
  ) INTO otp_info
  FROM public.user_otp_verification 
  WHERE email = (SELECT email FROM auth.users WHERE id = user_id_param)
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get profile info
  SELECT jsonb_build_object(
    'profile_completed', profile_completed,
    'completion_percentage', completion_percentage,
    'created_at', created_at
  ) INTO profile_info
  FROM public.profiles 
  WHERE user_id = user_id_param;

  RETURN jsonb_build_object(
    'user_id', user_id_param,
    'auth_info', COALESCE(auth_info, '{}'::jsonb),
    'account_type_info', COALESCE(account_type_info, '{}'::jsonb),
    'otp_info', COALESCE(otp_info, '{}'::jsonb),
    'profile_info', COALESCE(profile_info, '{}'::jsonb)
  );
END;
$$;

-- Update account type assignment to work even without email confirmation (for testing)
CREATE OR REPLACE FUNCTION public.assign_account_type_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  detected_type TEXT := 'client'; -- Default fallback
  user_email TEXT;
  signup_source TEXT;
BEGIN
  user_email := NEW.email;
  signup_source := COALESCE(NEW.raw_user_meta_data->>'signup_source', 'unknown');
  
  -- Log the trigger execution
  INSERT INTO public.error_logs (
    user_id,
    error_type,
    error_message,
    context,
    metadata
  ) VALUES (
    NEW.id,
    'account_type_assignment_trigger',
    'Account type assignment trigger fired',
    'assign_account_type_on_signup',
    jsonb_build_object(
      'email', user_email,
      'signup_source', signup_source,
      'email_confirmed_at', NEW.email_confirmed_at,
      'raw_user_meta_data', NEW.raw_user_meta_data
    )
  );

  -- Determine account type based on signup source and email
  IF signup_source = 'user_signup' THEN
    detected_type := 'user';
  ELSIF signup_source = 'client_signup' THEN
    detected_type := 'client';
  ELSIF user_email LIKE '%@user.usergy.ai' OR user_email LIKE '%user%' THEN
    detected_type := 'user';
  ELSE
    detected_type := 'client';
  END IF;

  -- Insert account type (removed email confirmation requirement for testing)
  INSERT INTO public.account_types (auth_user_id, account_type)
  VALUES (NEW.id, detected_type)
  ON CONFLICT (auth_user_id) DO NOTHING;

  -- Log successful assignment
  INSERT INTO public.error_logs (
    user_id,
    error_type,
    error_message,
    context,
    metadata
  ) VALUES (
    NEW.id,
    'account_type_assignment_success',
    'Account type assigned successfully',
    'assign_account_type_on_signup',
    jsonb_build_object(
      'assigned_type', detected_type,
      'email', user_email,
      'signup_source', signup_source
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.error_logs (
      user_id,
      error_type,
      error_message,
      context,
      metadata
    ) VALUES (
      NEW.id,
      'account_type_assignment_error',
      SQLERRM,
      'assign_account_type_on_signup',
      jsonb_build_object(
        'email', user_email,
        'signup_source', signup_source,
        'error_detail', SQLERRM
      )
    );
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created_assign_account_type ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_account_type
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_account_type_on_signup();

-- Add function to test Resend API connectivity
CREATE OR REPLACE FUNCTION public.test_email_configuration()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be called from the edge function to test email sending
  RETURN jsonb_build_object(
    'status', 'ready_for_testing',
    'timestamp', NOW(),
    'message', 'Email configuration test function ready'
  );
END;
$$;
