
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthRequest {
  action: 'generate' | 'verify' | 'resend';
  email: string;
  password?: string;
  otp?: string;
  account_type?: string;
  signup_source?: string;
  source_url?: string;
  referrer_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { action, email, password, otp, account_type, signup_source, source_url, referrer_url }: AuthRequest = await req.json();

    console.log(`Processing ${action} request for ${email}`, {
      account_type,
      signup_source,
      source_url,
      referrer_url
    });

    if (action === 'generate') {
      // Enhanced account type determination
      let finalAccountType = account_type || 'client'; // Default fallback
      
      // Enhanced logic for account type detection
      if (source_url) {
        if (source_url.includes('user.usergy.ai')) {
          finalAccountType = 'user';
        } else if (source_url.includes('client.usergy.ai')) {
          finalAccountType = 'client';
        }
      }
      
      if (referrer_url) {
        if (referrer_url.includes('user.usergy.ai')) {
          finalAccountType = 'user';
        } else if (referrer_url.includes('client.usergy.ai')) {
          finalAccountType = 'client';
        }
      }

      // Generate OTP and handle signup
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP verification record
      const { error: otpError } = await supabase
        .from('auth_otp_verifications')
        .insert({
          email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          account_type: finalAccountType,
          source_url: source_url || '',
          metadata: {
            password: password,
            signup_source: signup_source || 'enhanced_signup',
            referrer_url: referrer_url,
            enhanced_context: true
          }
        });

      if (otpError) {
        console.error('Error storing OTP:', otpError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate verification code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Send email (implement email sending logic here)
      console.log(`OTP generated for ${email}: ${otpCode} (Account Type: ${finalAccountType})`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code sent',
          account_type: finalAccountType
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify') {
      if (!otp || !password) {
        return new Response(
          JSON.stringify({ error: 'OTP and password are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Verify OTP
      const { data: otpData, error: otpFetchError } = await supabase
        .from('auth_otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .is('verified_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (otpFetchError || !otpData) {
        console.error('Invalid or expired OTP:', otpFetchError);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired verification code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          account_type: otpData.account_type,
          signup_source: otpData.metadata?.signup_source || 'enhanced_signup',
          source_url: otpData.source_url,
          referrer_url: otpData.metadata?.referrer_url,
          enhanced_signup: true,
          email_verified: true
        }
      });

      if (signUpError) {
        console.error('Error creating user:', signUpError);
        return new Response(
          JSON.stringify({ error: 'Failed to create account' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Store account type
      const { error: accountTypeError } = await supabase
        .from('account_types')
        .insert({
          auth_user_id: authData.user.id,
          account_type: otpData.account_type
        });

      if (accountTypeError) {
        console.error('Error storing account type:', accountTypeError);
      }

      // Mark OTP as verified
      await supabase
        .from('auth_otp_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', otpData.id);

      // Generate redirect URL based on account type
      let redirectUrl = '/profile-completion'; // Default fallback
      
      if (otpData.account_type === 'user') {
        redirectUrl = 'https://user.usergy.ai/profile-completion';
      } else if (otpData.account_type === 'client') {
        redirectUrl = 'https://client.usergy.ai/profile';
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: authData.user,
          isNewUser: true,
          accountType: otpData.account_type,
          redirectUrl: redirectUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'resend') {
      // Handle OTP resend logic
      const { data: existingOtp } = await supabase
        .from('auth_otp_verifications')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!existingOtp) {
        return new Response(
          JSON.stringify({ error: 'No verification request found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Generate new OTP
      const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await supabase
        .from('auth_otp_verifications')
        .update({
          otp_code: newOtpCode,
          expires_at: newExpiresAt.toISOString(),
          resend_attempts: (existingOtp.resend_attempts || 0) + 1
        })
        .eq('id', existingOtp.id);

      console.log(`OTP resent for ${email}: ${newOtpCode}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code resent'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Unified auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
