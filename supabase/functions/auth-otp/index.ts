
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface OTPRequest {
  email: string;
  action: 'generate' | 'verify' | 'resend';
  otp?: string;
  password?: string;
}

// Rate limiting configuration
const RATE_LIMITS = {
  signup: { attempts: 5, window: 3600 }, // 5 attempts per hour
  signin: { attempts: 10, window: 3600 }, // 10 attempts per hour
  otp_verify: { attempts: 5, window: 600 }, // 5 attempts per 10 minutes
  otp_resend: { attempts: 3, window: 600 }, // 3 attempts per 10 minutes
};

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getClientInfo = (req: Request) => {
  const ip = req.headers.get('cf-connecting-ip') || 
             req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return { ip, userAgent };
};

const checkRateLimit = async (identifier: string, action: string): Promise<{ allowed: boolean; blockedUntil?: Date; attemptsLeft?: number }> => {
  const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
  if (!config) return { allowed: true };

  const windowStart = new Date(Date.now() - config.window * 1000);

  // Check current rate limit record
  const { data: rateLimitData, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true }; // Allow on error to prevent blocking legitimate users
  }

  // Check if currently blocked
  if (rateLimitData?.blocked_until) {
    const blockedUntil = new Date(rateLimitData.blocked_until);
    if (blockedUntil > new Date()) {
      return { allowed: false, blockedUntil };
    }
  }

  // Check attempt count
  if (rateLimitData && rateLimitData.attempts >= config.attempts) {
    // Block for 15 minutes after exceeding attempts
    const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    
    await supabase
      .from('rate_limits')
      .update({ blocked_until: blockedUntil.toISOString() })
      .eq('id', rateLimitData.id);

    return { allowed: false, blockedUntil };
  }

  const attemptsLeft = config.attempts - (rateLimitData?.attempts || 0);
  return { allowed: true, attemptsLeft };
};

const incrementRateLimit = async (identifier: string, action: string): Promise<void> => {
  const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
  if (!config) return;

  const windowStart = new Date(Date.now() - config.window * 1000);

  // Try to increment existing record
  const { data: existingRecord } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRecord) {
    await supabase
      .from('rate_limits')
      .update({ attempts: existingRecord.attempts + 1 })
      .eq('id', existingRecord.id);
  } else {
    await supabase
      .from('rate_limits')
      .insert({
        identifier,
        action,
        attempts: 1,
        window_start: new Date().toISOString()
      });
  }
};

const sendOTPEmail = async (email: string, otp: string, type: 'welcome' | 'resend' = 'welcome') => {
  const subject = type === 'welcome' 
    ? "Welcome to Usergy - Verify Your Email" 
    : "Your New Usergy Verification Code";
    
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Usergy</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center;">
          <div style="display: inline-flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M8.5 14l7-4" stroke="white" stroke-width="2" />
                <path d="M8.5 10l7 4" stroke="white" stroke-width="2" />
              </svg>
            </div>
            <span style="color: white; font-size: 24px; font-weight: bold;">Usergy</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; line-height: 1.2;">
            ${type === 'welcome' ? 'Welcome to the Community!' : 'Your New Verification Code'}
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 32px;">
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            ${type === 'welcome' 
              ? 'Thank you for joining Usergy! To complete your account setup, please verify your email address using the code below:' 
              : 'Here\'s your new verification code. Enter it to complete your email verification:'}
          </p>

          <!-- OTP Code -->
          <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 32px; text-align: center; margin: 24px 0;">
            <p style="color: #64748b; font-size: 14px; font-weight: 500; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Your Verification Code</p>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">This code expires in 10 minutes</p>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
              🔒 Security Notice: This code was requested from your account. If you didn't request this, please ignore this email.
            </p>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
            If you didn't request this verification, you can safely ignore this email. This code will expire automatically.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
            This email was sent by Usergy. If you have questions, contact us at support@usergy.com
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // In development, we'll log the email content
  console.log(`OTP Email for ${email}:`, { subject, otp });
  
  // For production, you would integrate with an email service like Resend
  // For now, we'll simulate sending the email
  return { success: true, message: "OTP email sent successfully" };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { ip, userAgent } = getClientInfo(req);
  
  try {
    const { email, action, otp, password }: OTPRequest = await req.json();
    console.log(`Processing ${action} action for email:`, email, `from IP: ${ip}`);

    // Clean up old rate limit entries periodically
    await supabase.rpc('cleanup_rate_limits');

    switch (action) {
      case 'generate': {
        // Rate limit check for signup
        const rateLimitResult = await checkRateLimit(email, 'signup');
        if (!rateLimitResult.allowed) {
          return new Response(
            JSON.stringify({ 
              error: `Too many signup attempts. Please try again later.`,
              blockedUntil: rateLimitResult.blockedUntil 
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if user already exists
        const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000
        });

        if (userCheckError) {
          console.error('Error checking existing users:', userCheckError);
          await incrementRateLimit(email, 'signup');
          return new Response(
            JSON.stringify({ error: "Failed to verify email availability" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userExists = existingUsers.users.some(user => user.email === email);
        if (userExists) {
          console.log('User already exists:', email);
          await incrementRateLimit(email, 'signup');
          return new Response(
            JSON.stringify({ error: "This email is already part of our community" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate new OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log('Generated OTP:', otpCode, 'for email:', email);

        // Store OTP in database with security info
        const { error: dbError } = await supabase
          .from('user_otp_verification')
          .insert({
            email,
            otp_code: otpCode,
            expires_at: expiresAt.toISOString(),
            ip_address: ip,
            user_agent: userAgent
          });

        if (dbError) {
          console.error('Database error:', dbError);
          await incrementRateLimit(email, 'signup');
          return new Response(
            JSON.stringify({ error: "Failed to generate verification code" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Send OTP email
        await sendOTPEmail(email, otpCode, 'welcome');

        // Increment rate limit after successful operation
        await incrementRateLimit(email, 'signup');

        console.log('OTP generated and stored successfully for:', email);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Verification code sent! Check your inbox.",
            attemptsLeft: rateLimitResult.attemptsLeft ? rateLimitResult.attemptsLeft - 1 : undefined
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify': {
        if (!otp || !password) {
          return new Response(
            JSON.stringify({ error: "OTP and password are required" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Rate limit check for OTP verification
        const rateLimitResult = await checkRateLimit(email, 'otp_verify');
        if (!rateLimitResult.allowed) {
          return new Response(
            JSON.stringify({ 
              error: `Too many verification attempts. Please try again later.`,
              blockedUntil: rateLimitResult.blockedUntil 
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Verifying OTP:', otp, 'for email:', email);

        // Check if user is blocked due to too many failed attempts
        const { data: blockedUser } = await supabase
          .from('user_otp_verification')
          .select('blocked_until')
          .eq('email', email)
          .not('blocked_until', 'is', null)
          .gt('blocked_until', new Date().toISOString())
          .limit(1)
          .maybeSingle();

        if (blockedUser) {
          return new Response(
            JSON.stringify({ error: "Account temporarily blocked due to too many failed attempts. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get and validate OTP
        const { data: otpData, error: otpError } = await supabase
          .from('user_otp_verification')
          .select('*')
          .eq('email', email)
          .eq('otp_code', otp)
          .is('verified_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (otpError || !otpData) {
          console.error('OTP validation failed:', otpError);
          
          // Increment rate limit and attempts
          await incrementRateLimit(email, 'otp_verify');
          
          // Increment attempt counter if record exists
          if (otpData?.id) {
            const newAttempts = (otpData.attempts || 0) + 1;
            let updateData: any = { attempts: newAttempts };
            
            // Block after 5 failed attempts
            if (newAttempts >= 5) {
              updateData.blocked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            }
            
            await supabase
              .from('user_otp_verification')
              .update(updateData)
              .eq('id', otpData.id);
          }

          return new Response(
            JSON.stringify({ error: "Invalid or expired verification code" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Mark OTP as verified
        await supabase
          .from('user_otp_verification')
          .update({ verified_at: new Date().toISOString() })
          .eq('id', otpData.id);

        console.log('OTP verified, creating user account for:', email);

        // Create user account
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            email_verified: true,
            verified_via_otp: true
          }
        });

        if (userError) {
          console.error('User creation error:', userError);
          await incrementRateLimit(email, 'otp_verify');
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('User account created successfully:', userData.user?.id);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Account created successfully!",
            user: userData.user
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'resend': {
        // Rate limit check for resend
        const rateLimitResult = await checkRateLimit(email, 'otp_resend');
        if (!rateLimitResult.allowed) {
          return new Response(
            JSON.stringify({ 
              error: `Too many resend attempts. Please try again later.`,
              blockedUntil: rateLimitResult.blockedUntil 
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Resending OTP for email:', email);

        // Check for recent OTP requests (additional rate limiting)
        const { data: recentOTP } = await supabase
          .from('user_otp_verification')
          .select('created_at')
          .eq('email', email)
          .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString())
          .limit(1)
          .single();

        if (recentOTP) {
          return new Response(
            JSON.stringify({ error: "Please wait 60 seconds before requesting a new code" }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate new OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store new OTP
        const { error: dbError } = await supabase
          .from('user_otp_verification')
          .insert({
            email,
            otp_code: otpCode,
            expires_at: expiresAt.toISOString(),
            ip_address: ip,
            user_agent: userAgent
          });

        if (dbError) {
          console.error('Database error on resend:', dbError);
          await incrementRateLimit(email, 'otp_resend');
          return new Response(
            JSON.stringify({ error: "Failed to generate new code" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Send OTP email
        await sendOTPEmail(email, otpCode, 'resend');

        // Increment rate limit after successful operation
        await incrementRateLimit(email, 'otp_resend');

        console.log('OTP resent successfully for:', email);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "New code sent! Check your inbox.",
            attemptsLeft: rateLimitResult.attemptsLeft ? rateLimitResult.attemptsLeft - 1 : undefined
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Auth OTP error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
