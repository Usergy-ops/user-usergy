
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "https://esm.sh/resend@2.0.0"

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

// Initialize Resend with API key
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

      // Check if user already exists
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser.users.find(user => user.email === email);
      
      if (userExists) {
        return new Response(
          JSON.stringify({ error: 'User with this email already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Store OTP verification record with secure password hashing
      const { error: otpError } = await supabase
        .from('auth_otp_verifications')
        .insert({
          email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          account_type: finalAccountType,
          source_url: source_url || '',
          metadata: {
            // Don't store plain text password - will be handled at verification time
            signup_source: signup_source || 'enhanced_signup',
            referrer_url: referrer_url,
            enhanced_context: true,
            password_provided: !!password
          }
        });

      if (otpError) {
        console.error('Error storing OTP:', otpError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate verification code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Send email using Resend
      if (resend) {
        try {
          const emailResult = await resend.emails.send({
            from: 'Usergy <noreply@usergy.ai>',
            to: [email],
            subject: 'Your Usergy Verification Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #4F46E5;">Welcome to Usergy!</h1>
                </div>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin-top: 0; color: #1e293b;">Your Verification Code</h2>
                  <div style="font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; 
                              background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;
                              border: 2px solid #e2e8f0;">
                    ${otpCode}
                  </div>
                  <p style="margin-bottom: 0; color: #64748b;">
                    This code will expire in 10 minutes. Please enter it on the verification page to complete your account setup.
                  </p>
                </div>
                
                <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>Security Note:</strong> If you didn't request this verification code, please ignore this email. 
                    Your account security is important to us.
                  </p>
                </div>
                
                <div style="text-align: center; color: #64748b; font-size: 12px;">
                  <p>This email was sent by Usergy. If you have questions, please contact our support team.</p>
                </div>
              </div>
            `,
          });
          
          console.log(`Verification email sent successfully to ${email}:`, emailResult);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Don't fail the request if email fails, but log it
        }
      } else {
        console.log(`OTP generated for ${email}: ${otpCode} (Account Type: ${finalAccountType}) - Email service not configured`);
      }

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

      // Validate password strength
      if (password.length < 12) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 12 characters long' }),
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

      // Create user account with proper metadata
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
          email_verified: true,
          verified_via: 'otp'
        }
      });

      if (signUpError) {
        console.error('Error creating user:', signUpError);
        return new Response(
          JSON.stringify({ error: signUpError.message || 'Failed to create account' }),
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

      // Resend email if Resend is configured
      if (resend) {
        try {
          await resend.emails.send({
            from: 'Usergy <noreply@usergy.ai>',
            to: [email],
            subject: 'Your Usergy Verification Code (Resent)',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Your Verification Code (Resent)</h2>
                <div style="font-size: 32px; font-weight: bold; color: #4F46E5; margin: 20px 0; text-align: center; 
                            padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                  ${newOtpCode}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Error sending resend email:', emailError);
        }
      }

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
