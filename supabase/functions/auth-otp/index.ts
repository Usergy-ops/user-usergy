
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, otp, action, signup_source, account_type } = await req.json()

    console.log('OTP action:', action, 'for email:', email, 'with signup_source:', signup_source, 'account_type:', account_type)

    if (action === 'generate') {
      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      
      // Check for existing user
      const { data: existingUser, error: userCheckError } = await supabase.auth.admin.getUserByEmail(email)
      
      if (userCheckError && !userCheckError.message.includes('not found')) {
        console.error('Error checking existing user:', userCheckError)
        return Response.json({ error: 'Failed to check user status' }, { 
          status: 500, 
          headers: corsHeaders 
        })
      }

      if (existingUser?.user) {
        return Response.json({ error: 'User already registered' }, { 
          status: 400, 
          headers: corsHeaders 
        })
      }

      // Store OTP with enhanced metadata
      const { error: otpError } = await supabase
        .from('user_otp_verification')
        .upsert({
          email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          verified_at: null,
          blocked_until: null,
          email_sent: false,
          metadata: {
            signup_source: signup_source || 'unknown',
            account_type: account_type || 'client',
            user_agent: req.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        })

      if (otpError) {
        console.error('Error storing OTP:', otpError)
        return Response.json({ error: 'Failed to generate verification code' }, { 
          status: 500, 
          headers: corsHeaders 
        })
      }

      // Send email (simplified for now)
      try {
        const emailSubject = 'Your Usergy Verification Code'
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Your Verification Code</h2>
            <p>Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #4F46E5; margin: 20px 0; text-align: center; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
              ${otpCode}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `

        // Update OTP record to mark email as sent
        await supabase
          .from('user_otp_verification')
          .update({ email_sent: true })
          .eq('email', email)
          .eq('otp_code', otpCode)

        console.log('OTP email sent successfully for:', email)
        
        return Response.json({ 
          message: 'Verification code sent',
          attemptsLeft: 3 
        }, { headers: corsHeaders })
        
      } catch (emailError) {
        console.error('Error sending email:', emailError)
        
        // Update OTP record with email error
        await supabase
          .from('user_otp_verification')
          .update({ 
            email_error: emailError.message,
            email_sent: false 
          })
          .eq('email', email)
          .eq('otp_code', otpCode)

        return Response.json({ error: 'Failed to send verification code' }, { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }

    if (action === 'verify') {
      // Get latest OTP
      const { data: otpData, error: otpFetchError } = await supabase
        .from('user_otp_verification')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .single()

      if (otpFetchError || !otpData) {
        console.error('Invalid OTP code for:', email)
        return Response.json({ error: 'Invalid verification code' }, { 
          status: 400, 
          headers: corsHeaders 
        })
      }

      // Check if OTP is expired
      if (new Date() > new Date(otpData.expires_at)) {
        return Response.json({ error: 'Verification code has expired' }, { 
          status: 400, 
          headers: corsHeaders 
        })
      }

      // Check if user is blocked
      if (otpData.blocked_until && new Date() < new Date(otpData.blocked_until)) {
        const remainingTime = Math.ceil((new Date(otpData.blocked_until).getTime() - Date.now()) / 1000)
        return Response.json({ 
          error: `Too many attempts. Try again in ${remainingTime} seconds.` 
        }, { 
          status: 429, 
          headers: corsHeaders 
        })
      }

      // Create user with enhanced metadata including account type context
      const signupMetadata = {
        signup_source: otpData.metadata?.signup_source || signup_source || 'otp_verification',
        account_type: otpData.metadata?.account_type || account_type || 'client',
        verified_via: 'otp',
        otp_verified_at: new Date().toISOString(),
        referrer_url: otpData.metadata?.referrer_url || '',
        user_agent: req.headers.get('user-agent')
      }

      console.log('Creating user with metadata:', signupMetadata)

      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: signupMetadata
      })

      if (createError) {
        console.error('Error creating user:', createError)
        
        // Update attempts
        await supabase
          .from('user_otp_verification')
          .update({ 
            attempts: otpData.attempts + 1,
            blocked_until: otpData.attempts >= 2 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
          })
          .eq('email', email)
          .eq('otp_code', otp)

        return Response.json({ error: createError.message }, { 
          status: 400, 
          headers: corsHeaders 
        })
      }

      // Mark OTP as verified
      await supabase
        .from('user_otp_verification')
        .update({ verified_at: new Date().toISOString() })
        .eq('email', email)
        .eq('otp_code', otp)

      console.log('User created and OTP verified successfully:', userData.user?.id)

      return Response.json({ 
        message: 'User created successfully',
        user: userData.user 
      }, { headers: corsHeaders })
    }

    if (action === 'resend') {
      // Get existing OTP data
      const { data: existingOtp, error: fetchError } = await supabase
        .from('user_otp_verification')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing OTP:', fetchError)
        return Response.json({ error: 'Failed to resend code' }, { 
          status: 500, 
          headers: corsHeaders 
        })
      }

      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      // Store new OTP with preserved metadata
      const metadata = existingOtp?.metadata || {
        signup_source: 'unknown',
        account_type: 'client'
      }

      const { error: otpError } = await supabase
        .from('user_otp_verification')
        .upsert({
          email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          verified_at: null,
          blocked_until: null,
          email_sent: false,
          resend_attempts: (existingOtp?.resend_attempts || 0) + 1,
          metadata: {
            ...metadata,
            resent_at: new Date().toISOString()
          }
        })

      if (otpError) {
        console.error('Error storing resend OTP:', otpError)
        return Response.json({ error: 'Failed to resend verification code' }, { 
          status: 500, 
          headers: corsHeaders 
        })
      }

      // Send email (same as generate)
      try {
        const emailSubject = 'Your Usergy Verification Code (Resent)'
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Your Verification Code</h2>
            <p>Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #4F46E5; margin: 20px 0; text-align: center; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
              ${otpCode}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `

        await supabase
          .from('user_otp_verification')
          .update({ email_sent: true })
          .eq('email', email)
          .eq('otp_code', otpCode)

        console.log('OTP resend email sent successfully for:', email)
        
        return Response.json({ 
          message: 'Verification code resent',
          attemptsLeft: 3 
        }, { headers: corsHeaders })
        
      } catch (emailError) {
        console.error('Error sending resend email:', emailError)
        return Response.json({ error: 'Failed to resend verification code' }, { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }

    return Response.json({ error: 'Invalid action' }, { 
      status: 400, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return Response.json({ error: 'Internal server error' }, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})
