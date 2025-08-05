import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '');

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
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          background-color: #f8fafc;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 48px 32px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)" /></svg>') repeat;
          opacity: 0.3;
        }
        .header-content {
          position: relative;
          z-index: 1;
        }
        .logo {
          display: inline-flex;
          align-items: center;
          margin-bottom: 24px;
        }
        .logo-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          backdrop-filter: blur(10px);
        }
        .logo-text {
          color: white;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: -0.5px;
        }
        .header-title {
          color: white;
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          line-height: 1.2;
        }
        .header-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
          margin: 16px 0 0 0;
          line-height: 1.5;
        }
        .content {
          padding: 48px 32px;
        }
        .content-text {
          color: #475569;
          font-size: 18px;
          line-height: 1.6;
          margin: 0 0 32px 0;
        }
        .otp-container {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          margin: 32px 0;
          position: relative;
          overflow: hidden;
        }
        .otp-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(100,116,139,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)" /></svg>') repeat;
          opacity: 0.5;
        }
        .otp-content {
          position: relative;
          z-index: 1;
        }
        .otp-label {
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .otp-code {
          font-size: 42px;
          font-weight: bold;
          color: #1e293b;
          letter-spacing: 12px;
          font-family: 'Courier New', monospace;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin: 0;
        }
        .otp-expiry {
          color: #64748b;
          font-size: 14px;
          margin: 12px 0 0 0;
          font-weight: 500;
        }
        .instructions {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin: 32px 0;
        }
        .instructions h3 {
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
        }
        .instructions-icon {
          width: 20px;
          height: 20px;
          margin-right: 8px;
        }
        .instructions ol {
          color: #64748b;
          font-size: 16px;
          line-height: 1.6;
          margin: 0;
          padding-left: 20px;
        }
        .instructions li {
          margin-bottom: 8px;
        }
        .security-notice {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 12px;
          padding: 20px;
          margin: 32px 0;
        }
        .security-notice p {
          color: #92400e;
          font-size: 15px;
          margin: 0;
          font-weight: 500;
          display: flex;
          align-items: flex-start;
        }
        .security-icon {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          margin-top: 1px;
          flex-shrink: 0;
        }
        .help-text {
          color: #64748b;
          font-size: 15px;
          line-height: 1.6;
          margin: 32px 0 0 0;
          text-align: center;
        }
        .help-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
        .footer {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 32px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .footer-logo {
          color: #667eea;
          font-size: 18px;
          font-weight: 600;
          vertical-align: middle;
          margin-left: 8px;
        }
        .footer-text {
          color: #64748b;
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }
        .footer-icon {
          width: 24px;
          height: 24px;
          margin-right: 8px;
          vertical-align: middle;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <div class="logo">
              <div class="logo-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="18" cy="18" r="3" />
                  <path d="M8.5 14l7-4" stroke="white" stroke-width="2" />
                  <path d="M8.5 10l7 4" stroke="white" stroke-width="2" />
                </svg>
              </div>
              <span class="logo-text">Usergy</span>
            </div>
            <h1 class="header-title">
              ${type === 'welcome' ? 'Welcome to the Community!' : 'Your New Verification Code'}
            </h1>
            <p class="header-subtitle">
              ${type === 'welcome' ? 'You\'re just one step away from joining!' : 'Here\'s your fresh verification code'}
            </p>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <p class="content-text">
            ${type === 'welcome' 
              ? 'Thank you for joining Usergy! To complete your account setup, please verify your email address using the code below:' 
              : 'Here\'s your new verification code. Enter it to complete your email verification:'}
          </p>

          <!-- OTP Code -->
          <div class="otp-container">
            <div class="otp-content">
              <p class="otp-label">Your Verification Code</p>
              <div class="otp-code">${otp}</div>
              <p class="otp-expiry">This code expires in 10 minutes</p>
            </div>
          </div>

          <!-- Instructions -->
          <div class="instructions">
            <h3>
              <svg class="instructions-icon" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              Next Steps
            </h3>
            <ol>
              <li>Return to the Usergy signup page</li>
              <li>Enter the 6-digit code above</li>
              <li>Complete your profile and start exploring!</li>
            </ol>
          </div>

          <!-- Security Notice -->
          <div class="security-notice">
            <p>
              <svg class="security-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="m12 17 .01 0"/>
              </svg>
              Security Notice: This code was requested for your account. If you didn't request this verification, please ignore this email and your account will remain secure.
            </p>
          </div>

          <p class="help-text">
            Need help? Contact our support team at <a href="mailto:support@user.usergy.ai" class="help-link">support@user.usergy.ai</a>
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div style="margin-bottom: 16px;">
            <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2">
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <path d="M8.5 14l7-4" />
              <path d="M8.5 10l7 4" />
            </svg>
            <span class="footer-logo">Usergy</span>
          </div>
          <p class="footer-text">
            This email was sent by Usergy, the professional networking platform.<br>
            © 2024 Usergy. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`Sending OTP email to ${email} via Resend`);
    
    const { data, error } = await resend.emails.send({
      from: 'Usergy <onboarding@user.usergy.ai>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully via Resend:', data);
    return { success: true, message: "OTP email sent successfully", emailId: data?.id };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
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

        // Send OTP email via Resend
        try {
          await sendOTPEmail(email, otpCode, 'welcome');
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          // Clean up the OTP record since email failed
          await supabase
            .from('user_otp_verification')
            .delete()
            .eq('email', email)
            .eq('otp_code', otpCode);
          
          await incrementRateLimit(email, 'signup');
          return new Response(
            JSON.stringify({ error: "Failed to send verification email. Please try again." }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Increment rate limit after successful operation
        await incrementRateLimit(email, 'signup');

        console.log('OTP generated and email sent successfully for:', email);
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

        // Send OTP email via Resend
        try {
          await sendOTPEmail(email, otpCode, 'resend');
        } catch (emailError) {
          console.error('Email sending failed on resend:', emailError);
          // Clean up the OTP record since email failed
          await supabase
            .from('user_otp_verification')
            .delete()
            .eq('email', email)
            .eq('otp_code', otpCode);
          
          await incrementRateLimit(email, 'otp_resend');
          return new Response(
            JSON.stringify({ error: "Failed to send new verification email. Please try again." }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

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
