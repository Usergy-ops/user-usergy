
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  email: string;
  action: 'send' | 'verify' | 'resend';
  otp?: string;
  password?: string;
  accountType: 'user' | 'client';
  sourceUrl: string;
  userAgent?: string;
}

// Generate cryptographically secure 6-digit OTP
function generateSecureOTP(): string {
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array, byte => (byte % 10).toString()).join('');
}

// Create secure identifier for rate limiting
function createIdentifier(email: string, ip: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${email}:${ip}`);
  return Array.from(new Uint8Array(data.slice(0, 16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Check progressive rate limiting
async function checkRateLimit(identifier: string, action: string): Promise<{
  allowed: boolean;
  attemptsLeft?: number;
  blockedUntil?: string;
  retryAfter?: number;
}> {
  try {
    // Apply progressive rate limiting
    const { data: rateLimitData, error } = await supabase
      .rpc('apply_progressive_rate_limit', {
        identifier_param: identifier,
        action_param: action,
        base_attempts: action === 'otp_verify' ? 5 : 3,
        base_window_minutes: action === 'otp_verify' ? 10 : 60
      });

    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Fail open for availability
    }

    // Check current rate limit status
    const { data: currentLimit, error: fetchError } = await supabase
      .from('enhanced_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Rate limit fetch error:', fetchError);
      return { allowed: true }; // Fail open
    }

    if (currentLimit?.blocked_until && new Date(currentLimit.blocked_until) > new Date()) {
      const blockedUntil = new Date(currentLimit.blocked_until);
      return {
        allowed: false,
        blockedUntil: blockedUntil.toISOString(),
        retryAfter: Math.ceil((blockedUntil.getTime() - Date.now()) / 1000)
      };
    }

    const maxAttempts = rateLimitData?.max_attempts || 5;
    const currentAttempts = currentLimit?.attempts || 0;
    const attemptsLeft = Math.max(0, maxAttempts - currentAttempts);

    return {
      allowed: attemptsLeft > 0,
      attemptsLeft
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true }; // Fail open for system availability
  }
}

// Update rate limit attempt count
async function updateRateLimit(identifier: string, action: string, blocked: boolean = false): Promise<void> {
  try {
    const windowStart = new Date();
    const blockDuration = action === 'otp_verify' ? 15 : 60; // minutes

    // Get existing record
    const { data: existing } = await supabase
      .from('enhanced_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const attempts = (existing?.attempts || 0) + 1;
    const escalationLevel = existing?.escalation_level || 0;
    const totalViolations = existing?.total_violations || 0;

    const updateData = {
      identifier,
      action,
      attempts,
      window_start: existing?.window_start || windowStart.toISOString(),
      blocked_until: blocked ? new Date(Date.now() + (blockDuration * 60 * 1000)).toISOString() : null,
      escalation_level: blocked ? escalationLevel + 1 : escalationLevel,
      total_violations: blocked ? totalViolations + 1 : totalViolations,
      last_violation_at: blocked ? new Date().toISOString() : existing?.last_violation_at,
      metadata: {
        action,
        timestamp: new Date().toISOString(),
        blocked
      }
    };

    if (existing) {
      await supabase
        .from('enhanced_rate_limits')
        .update(updateData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('enhanced_rate_limits')
        .insert(updateData);
    }
  } catch (error) {
    console.error('Rate limit update error:', error);
  }
}

// Send OTP email using Resend
async function sendOTPEmail(email: string, otp: string, accountType: string): Promise<boolean> {
  try {
    const result = await resend.emails.send({
      from: 'Usergy <noreply@usergy.ai>',
      to: [email],
      subject: 'Your Usergy verification code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin: 0;">Usergy</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Verify your ${accountType} account</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">Your verification code:</p>
                <div style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 8px; font-family: monospace;">${otp}</div>
              </div>
            </div>
            
            <div style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 Usergy. All rights reserved.</p>
            </div>
          </div>
        </div>
      `
    });

    // Log email attempt
    await supabase.from('email_send_logs').insert({
      email,
      email_type: 'otp_verification',
      status: result.error ? 'failed' : 'sent',
      error_message: result.error?.message,
      resend_response: result,
      metadata: { account_type: accountType }
    });

    return !result.error;
  } catch (error) {
    console.error('Email send error:', error);
    
    await supabase.from('email_send_logs').insert({
      email,
      email_type: 'otp_verification',
      status: 'failed',
      error_message: error.message,
      metadata: { account_type: accountType }
    });
    
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action, otp, password, accountType, sourceUrl, userAgent }: OTPRequest = await req.json();
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const identifier = createIdentifier(email, clientIP);

    console.log(`OTP ${action} request for ${email} (${accountType})`);

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(identifier, `otp_${action}`);
    if (!rateLimitResult.allowed) {
      await updateRateLimit(identifier, `otp_${action}`, true);
      return new Response(JSON.stringify({
        error: rateLimitResult.blockedUntil 
          ? `Too many attempts. Try again after ${new Date(rateLimitResult.blockedUntil).toLocaleTimeString()}`
          : 'Rate limit exceeded. Please wait before trying again.',
        blocked: true,
        retryAfter: rateLimitResult.retryAfter,
        attemptsLeft: 0
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'send' || action === 'resend') {
      // Generate and store new OTP
      const otpCode = generateSecureOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { error: insertError } = await supabase
        .from('auth_otp_verifications')
        .insert({
          email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          account_type: accountType,
          source_url: sourceUrl,
          user_agent: userAgent,
          ip_address: clientIP,
          attempts: 0,
          email_sent: false
        });

      if (insertError) {
        console.error('OTP insertion error:', insertError);
        await updateRateLimit(identifier, `otp_${action}`, false);
        return new Response(JSON.stringify({
          error: 'Failed to generate verification code'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Send email
      const emailSent = await sendOTPEmail(email, otpCode, accountType);
      
      // Update email sent status
      await supabase
        .from('auth_otp_verifications')
        .update({ 
          email_sent: emailSent,
          email_error: emailSent ? null : 'Failed to send email'
        })
        .eq('email', email)
        .eq('otp_code', otpCode);

      await updateRateLimit(identifier, `otp_${action}`, false);

      return new Response(JSON.stringify({
        success: true,
        message: emailSent 
          ? 'Verification code sent successfully'
          : 'Code generated but email delivery failed',
        emailSent,
        attemptsLeft: (rateLimitResult.attemptsLeft || 3) - 1
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'verify') {
      if (!otp || !password) {
        return new Response(JSON.stringify({
          error: 'OTP and password are required for verification'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get OTP record
      const { data: otpRecord, error: otpError } = await supabase
        .from('auth_otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .is('verified_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpError) {
        console.error('OTP fetch error:', otpError);
        await updateRateLimit(identifier, 'otp_verify', false);
        return new Response(JSON.stringify({
          error: 'Verification failed'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!otpRecord) {
        await updateRateLimit(identifier, 'otp_verify', false);
        return new Response(JSON.stringify({
          error: 'Invalid or expired verification code',
          attemptsLeft: (rateLimitResult.attemptsLeft || 5) - 1
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check expiration
      if (new Date(otpRecord.expires_at) < new Date()) {
        await updateRateLimit(identifier, 'otp_verify', false);
        return new Response(JSON.stringify({
          error: 'Verification code has expired',
          expired: true
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update attempt count
      const attempts = (otpRecord.attempts || 0) + 1;
      if (attempts > 5) {
        await supabase
          .from('auth_otp_verifications')
          .update({ 
            blocked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            attempts 
          })
          .eq('id', otpRecord.id);

        await updateRateLimit(identifier, 'otp_verify', true);
        return new Response(JSON.stringify({
          error: 'Too many failed attempts. Please request a new code.',
          blocked: true
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create user account with Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          account_type: accountType,
          signup_source: sourceUrl,
          verified_via: 'otp',
          otp_verified_at: new Date().toISOString()
        }
      });

      if (authError) {
        console.error('User creation error:', authError);
        await supabase
          .from('auth_otp_verifications')
          .update({ attempts })
          .eq('id', otpRecord.id);

        await updateRateLimit(identifier, 'otp_verify', false);
        
        return new Response(JSON.stringify({
          error: authError.message.includes('already registered') 
            ? 'An account with this email already exists'
            : 'Failed to create account',
          attemptsLeft: 5 - attempts
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Mark OTP as verified
      await supabase
        .from('auth_otp_verifications')
        .update({ 
          verified_at: new Date().toISOString(),
          attempts 
        })
        .eq('id', otpRecord.id);

      console.log(`User created successfully: ${authUser.user.id} (${email})`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Account created successfully',
        user: {
          id: authUser.user.id,
          email: authUser.user.email
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Auth OTP error:', error);
    
    // Log error
    await supabase.from('error_logs').insert({
      error_type: 'auth_otp_error',
      error_message: error.message,
      error_stack: error.stack,
      context: 'auth-otp-edge-function',
      metadata: {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries(req.headers.entries())
      }
    });

    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
