
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthRequest {
  action: 'generate' | 'verify' | 'resend' | 'handle_oauth_callback';
  email?: string;
  password?: string;
  otp?: string;
  account_type?: string;
  signup_source?: string;
  source_url?: string;
  referrer_url?: string;
  oauth_state?: any;
  user_metadata?: any;
}

const determineAccountType = (
  sourceUrl?: string, 
  referrerUrl?: string, 
  accountType?: string,
  userMetadata?: any
): string => {
  console.log('Determining account type with:', {
    sourceUrl,
    referrerUrl, 
    accountType,
    userMetadata
  });

  // Priority 1: Explicit account type parameter
  if (accountType && ['user', 'client'].includes(accountType)) {
    console.log('Account type determined from parameter:', accountType);
    return accountType;
  }

  // Priority 2: User metadata (from OAuth or other sources)
  if (userMetadata?.account_type && ['user', 'client'].includes(userMetadata.account_type)) {
    console.log('Account type determined from metadata:', userMetadata.account_type);
    return userMetadata.account_type;
  }

  // Priority 3: Source URL domain detection
  if (sourceUrl) {
    if (sourceUrl.includes('user.usergy.ai')) {
      console.log('Account type determined from source URL (user)');
      return 'user';
    } else if (sourceUrl.includes('client.usergy.ai')) {
      console.log('Account type determined from source URL (client)');
      return 'client';
    }
  }

  // Priority 4: Referrer URL domain detection
  if (referrerUrl) {
    if (referrerUrl.includes('user.usergy.ai')) {
      console.log('Account type determined from referrer URL (user)');
      return 'user';
    } else if (referrerUrl.includes('client.usergy.ai')) {
      console.log('Account type determined from referrer URL (client)');
      return 'client';
    }
  }

  console.log('Account type defaulting to client');
  return 'client'; // Default fallback
};

const generateRedirectUrl = (accountType: string): string => {
  if (accountType === 'user') {
    return 'https://user.usergy.ai/profile-completion';
  } else if (accountType === 'client') {
    return 'https://client.usergy.ai/profile';
  }
  return '/profile-completion'; // Fallback
};

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

    const requestData: AuthRequest = await req.json();
    const { 
      action, 
      email, 
      password, 
      otp, 
      account_type, 
      signup_source, 
      source_url, 
      referrer_url,
      oauth_state,
      user_metadata 
    } = requestData;

    console.log(`Processing ${action} request`, {
      email,
      account_type,
      signup_source,
      source_url,
      referrer_url,
      oauth_state,
      user_metadata
    });

    if (action === 'generate') {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Determine account type using enhanced logic
      const finalAccountType = determineAccountType(
        source_url,
        referrer_url,
        account_type,
        user_metadata
      );

      // Check if user already exists
      const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers();
      if (userCheckError) {
        console.error('Error checking existing users:', userCheckError);
        return new Response(
          JSON.stringify({ error: 'Failed to check user status' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const existingUser = existingUsers.users.find(user => user.email === email);
      if (existingUser) {
        console.log('User already exists:', email);
        return new Response(
          JSON.stringify({ error: 'User already registered' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Generate OTP and store with enhanced context
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Clean up any existing OTP records for this email
      await supabase
        .from('auth_otp_verifications')
        .delete()
        .eq('email', email);

      // Store new OTP verification record
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
            enhanced_context: true,
            generated_at: new Date().toISOString()
          }
        });

      if (otpError) {
        console.error('Error storing OTP:', otpError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate verification code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`OTP generated for ${email}: ${otpCode} (Account Type: ${finalAccountType})`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code sent',
          account_type: finalAccountType,
          debug_info: {
            otp_code: otpCode, // Remove in production
            expires_at: expiresAt.toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify') {
      if (!email || !otp || !password) {
        return new Response(
          JSON.stringify({ error: 'Email, OTP, and password are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log(`Verifying OTP for ${email} with code: ${otp}`);

      // Get the most recent OTP record for this email
      const { data: otpRecords, error: otpFetchError } = await supabase
        .from('auth_otp_verifications')
        .select('*')
        .eq('email', email)
        .is('verified_at', null)
        .order('created_at', { ascending: false });

      if (otpFetchError) {
        console.error('Error fetching OTP records:', otpFetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (!otpRecords || otpRecords.length === 0) {
        console.log('No OTP records found for email:', email);
        return new Response(
          JSON.stringify({ error: 'No verification code found. Please request a new one.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Find matching OTP code
      const otpData = otpRecords.find(record => record.otp_code === otp);
      
      if (!otpData) {
        console.log('Invalid OTP code provided. Available codes:', otpRecords.map(r => r.otp_code));
        return new Response(
          JSON.stringify({ error: 'Invalid verification code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check if OTP is expired
      if (new Date() > new Date(otpData.expires_at)) {
        console.log('OTP expired for:', email);
        return new Response(
          JSON.stringify({ error: 'Verification code has expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Create user account with enhanced metadata
      const signupMetadata = {
        account_type: otpData.account_type,
        signup_source: otpData.metadata?.signup_source || 'enhanced_signup',
        source_url: otpData.source_url,
        referrer_url: otpData.metadata?.referrer_url,
        enhanced_signup: true,
        email_verified: true,
        otp_verified_at: new Date().toISOString()
      };

      console.log('Creating user with metadata:', signupMetadata);

      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: signupMetadata
      });

      if (signUpError) {
        console.error('Error creating user:', signUpError);
        return new Response(
          JSON.stringify({ error: 'Failed to create account: ' + signUpError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Store account type in database
      const { error: accountTypeError } = await supabase
        .from('account_types')
        .insert({
          auth_user_id: authData.user.id,
          account_type: otpData.account_type
        });

      if (accountTypeError) {
        console.error('Error storing account type:', accountTypeError);
      }

      // Mark OTP as verified and clean up
      await supabase
        .from('auth_otp_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', otpData.id);

      // Generate appropriate redirect URL
      const redirectUrl = generateRedirectUrl(otpData.account_type);

      console.log('User created successfully:', {
        user_id: authData.user?.id,
        account_type: otpData.account_type,
        redirect_url: redirectUrl
      });

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
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Get the most recent OTP record
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
          resend_attempts: (existingOtp.resend_attempts || 0) + 1,
          verified_at: null // Reset verification status
        })
        .eq('id', existingOtp.id);

      console.log(`OTP resent for ${email}: ${newOtpCode}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code resent',
          debug_info: {
            otp_code: newOtpCode, // Remove in production
            expires_at: newExpiresAt.toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'handle_oauth_callback') {
      // Handle OAuth callback with proper account type assignment
      if (!oauth_state || !user_metadata) {
        return new Response(
          JSON.stringify({ error: 'OAuth state and user metadata required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const accountType = determineAccountType(
        oauth_state.source_url,
        oauth_state.referrer_url,
        oauth_state.account_type,
        user_metadata
      );

      const redirectUrl = generateRedirectUrl(accountType);

      console.log('OAuth callback processed:', {
        account_type: accountType,
        redirect_url: redirectUrl,
        oauth_state
      });

      return new Response(
        JSON.stringify({
          success: true,
          accountType: accountType,
          redirectUrl: redirectUrl
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
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
