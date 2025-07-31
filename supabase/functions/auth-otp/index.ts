
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  email: string;
  otp?: string;
  password?: string;
  action: 'generate' | 'verify' | 'resend';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, otp, password, action }: OTPRequest = await req.json();

    console.log(`Processing ${action} request for email: ${email}`);

    if (action === 'generate') {
      // Generate and store OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in user_otp_verification table (not client_workflow.otp_verifications)
      const { error: otpError } = await supabaseClient
        .from('user_otp_verification')
        .insert({
          email: email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          max_attempts: 3
        });

      if (otpError) {
        console.error('Error storing OTP:', otpError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate OTP' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Create the user account (but don't confirm email yet)
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: false, // Don't confirm email yet - wait for OTP verification
        user_metadata: {
          signup_source: 'client_signup',
          account_type: 'client'
        }
      });

      if (signUpError) {
        console.error('Error creating user:', signUpError);
        
        // Handle duplicate user case
        if (signUpError.message.includes('already') || signUpError.message.includes('duplicate')) {
          return new Response(
            JSON.stringify({ error: 'This email is already registered. Please sign in instead.' }),
            { 
              status: 409, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`OTP ${otpCode} generated for ${email} (expires: ${expiresAt})`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          attemptsLeft: 3
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (action === 'verify') {
      if (!otp) {
        return new Response(
          JSON.stringify({ error: 'OTP is required for verification' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get the OTP record
      const { data: otpRecord, error: fetchError } = await supabaseClient
        .from('user_otp_verification')
        .select('*')
        .eq('email', email)
        .is('verified_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !otpRecord) {
        console.error('Error fetching OTP:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired OTP' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if OTP is expired
      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'OTP has expired. Please request a new one.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if blocked
      if (otpRecord.blocked_until && new Date(otpRecord.blocked_until) > new Date()) {
        const blockedUntil = new Date(otpRecord.blocked_until);
        const waitTime = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000);
        return new Response(
          JSON.stringify({ 
            error: `Account temporarily blocked due to too many failed attempts. Please try again in ${waitTime} seconds.` 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check OTP
      if (otpRecord.otp_code !== otp) {
        const newAttempts = otpRecord.attempts + 1;
        const updateData: any = { attempts: newAttempts };

        // Block if max attempts reached
        if (newAttempts >= otpRecord.max_attempts) {
          updateData.blocked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // Block for 15 minutes
        }

        await supabaseClient
          .from('user_otp_verification')
          .update(updateData)
          .eq('id', otpRecord.id);

        return new Response(
          JSON.stringify({ 
            error: newAttempts >= otpRecord.max_attempts 
              ? 'Too many failed attempts. Account temporarily blocked.'
              : `Invalid OTP. ${otpRecord.max_attempts - newAttempts} attempts remaining.`
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Mark OTP as verified
      await supabaseClient
        .from('user_otp_verification')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', otpRecord.id);

      // Now confirm the user's email
      const { error: confirmError } = await supabaseClient.auth.admin.updateUserById(
        // Find user by email
        (await supabaseClient.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || '',
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('Error confirming user email:', confirmError);
        return new Response(
          JSON.stringify({ error: 'Failed to confirm email' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`OTP verified successfully for ${email}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP verified successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (action === 'resend') {
      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store new OTP
      const { error: otpError } = await supabaseClient
        .from('user_otp_verification')
        .insert({
          email: email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          max_attempts: 3
        });

      if (otpError) {
        console.error('Error storing resent OTP:', otpError);
        return new Response(
          JSON.stringify({ error: 'Failed to resend OTP' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`New OTP ${otpCode} generated for ${email} (expires: ${expiresAt})`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'New OTP sent successfully',
          attemptsLeft: 3
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
