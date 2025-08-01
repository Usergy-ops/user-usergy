
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

serve(async (req) => {
  console.log(`Unified Auth Handler: ${req.method} request received`)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const { action, email, password, otp, signup_source, account_type } = requestBody
    
    console.log(`Unified Auth Handler: ${action} action requested`)
    console.log(`Request data:`, { email: email ? 'provided' : 'missing', action, account_type, signup_source })
    
    // Validate required fields
    if (!action) {
      throw new Error('Action is required')
    }
    
    if (!email) {
      throw new Error('Email is required')
    }
    
    // Determine account type from signup source
    const finalAccountType = account_type || (signup_source?.includes('user') ? 'user' : 'client')
    
    console.log(`Processing action: ${action} for email: ${email} with account type: ${finalAccountType}`)

    switch (action) {
      case 'generate':
        return await handleGenerateOTP(email, password, finalAccountType)
      case 'verify':
        return await handleVerifyOTP(email, otp, password)
      case 'resend':
        return await handleResendOTP(email, finalAccountType)
      default:
        throw new Error(`Invalid action: ${action}`)
    }
  } catch (error: any) {
    console.error('Unified auth error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack ? error.stack.substring(0, 500) : undefined
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGenerateOTP(email: string, password: string, accountType: string) {
  try {
    console.log(`Generating OTP for email: ${email}, account type: ${accountType}`)
    
    if (!password) {
      throw new Error('Password is required')
    }
    
    // Check if user exists
    const { data: users, error: listUsersError } = await supabase.auth.admin.listUsers()
    
    if (listUsersError) {
      console.error('Error listing users:', listUsersError)
      throw new Error('Failed to check existing users')
    }
    
    const existingUser = users?.users?.find(u => u.email === email)
    if (existingUser) {
      console.log(`User already exists: ${email}`)
      throw new Error('User already exists')
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    
    console.log(`Generated OTP code for ${email}: ${otpCode}`)

    // Store OTP in the unified table
    const { error: insertError } = await supabase.from('auth_otp_verifications').insert({
      email,
      otp_code: otpCode,
      source_url: accountType === 'user' ? 'https://user.usergy.ai' : 'https://client.usergy.ai',
      account_type: accountType,
      expires_at: expiresAt.toISOString(),
      metadata: { 
        password,
        created_at: new Date().toISOString(),
        user_agent: req.headers.get('user-agent') || 'unknown'
      }
    })

    if (insertError) {
      console.error('Error storing OTP:', insertError)
      throw new Error('Failed to store verification code')
    }
    
    console.log(`OTP stored successfully for ${email}`)

    // Send OTP email using Resend
    try {
      const emailResponse = await resend.emails.send({
        from: 'Usergy <no-reply@usergy.ai>',
        to: [email],
        subject: 'Your Usergy Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Welcome to Usergy!</h1>
              <p style="color: #666; font-size: 16px;">Please verify your email address to complete your ${accountType} account setup.</p>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0;">
              <p style="color: #333; margin-bottom: 15px; font-size: 18px;">Your verification code is:</p>
              <div style="font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; margin: 20px 0; padding: 20px; background-color: white; border-radius: 8px; border: 2px solid #E5E7EB;">
                ${otpCode}
              </div>
              <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
              <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
              <p style="color: #666; font-size: 14px;">For support, contact us at support@usergy.ai</p>
            </div>
          </div>
        `
      })
      
      console.log('Email sent successfully via Resend:', emailResponse)
      
      if (emailResponse.error) {
        console.error('Resend API error:', emailResponse.error)
        throw new Error(`Failed to send email: ${emailResponse.error.message}`)
      }

    } catch (emailError) {
      console.error('Error sending email:', emailError)
      
      // Update OTP record with email error
      await supabase
        .from('auth_otp_verifications')
        .update({ 
          metadata: { 
            ...{ password, created_at: new Date().toISOString() },
            email_error: emailError.message,
            email_sent: false 
          }
        })
        .eq('email', email)
        .eq('otp_code', otpCode)

      throw new Error('Failed to send verification email. Please try again.')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Verification code sent successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in handleGenerateOTP:', error)
    throw error
  }
}

async function handleVerifyOTP(email: string, otp: string, password: string) {
  try {
    console.log(`Verifying OTP for email: ${email}`)
    
    if (!otp) {
      throw new Error('Verification code is required')
    }
    
    if (!password) {
      throw new Error('Password is required')
    }

    // Get OTP record
    const { data: otpData, error: fetchError } = await supabase
      .from('auth_otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .is('verified_at', null)
      .single()

    if (fetchError || !otpData) {
      console.error('Invalid OTP for email:', email, fetchError)
      throw new Error('Invalid or expired verification code')
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpData.expires_at)) {
      console.log(`OTP expired for email: ${email}`)
      throw new Error('Verification code has expired')
    }

    console.log(`Valid OTP found for ${email}, creating user...`)

    // Create user with proper metadata
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        account_type: otpData.account_type,
        source_url: otpData.source_url,
        signup_source: `unified_otp_${otpData.account_type}`,
        verified_via: 'otp',
        otp_verified_at: new Date().toISOString()
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      throw new Error(createError.message || 'Failed to create user account')
    }

    console.log(`User created successfully:`, userData.user?.id)

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('auth_otp_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpData.id)

    if (updateError) {
      console.error('Error updating OTP verification status:', updateError)
      // Don't throw here as user is already created
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Account created successfully',
        user: userData.user 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in handleVerifyOTP:', error)
    throw error
  }
}

async function handleResendOTP(email: string, accountType: string = 'client') {
  try {
    console.log(`Resending OTP for email: ${email}`)
    
    // Get existing OTP data
    const { data: existingOtp } = await supabase
      .from('auth_otp_verifications')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Preserve metadata or create new
    const metadata = existingOtp?.metadata || {
      account_type: accountType,
      created_at: new Date().toISOString()
    }

    // Store new OTP
    const { error: insertError } = await supabase
      .from('auth_otp_verifications')
      .insert({
        email,
        otp_code: otpCode,
        source_url: accountType === 'user' ? 'https://user.usergy.ai' : 'https://client.usergy.ai',
        account_type: accountType,
        expires_at: expiresAt.toISOString(),
        metadata: {
          ...metadata,
          resent_at: new Date().toISOString(),
          resend_count: (existingOtp?.metadata?.resend_count || 0) + 1
        }
      })

    if (insertError) {
      console.error('Error storing resend OTP:', insertError)
      throw new Error('Failed to generate new verification code')
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: 'Usergy <no-reply@usergy.ai>',
      to: [email],
      subject: 'Your New Usergy Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">New Verification Code</h1>
            <p style="color: #666; font-size: 16px;">Here's your new verification code for your Usergy account.</p>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0;">
            <p style="color: #333; margin-bottom: 15px; font-size: 18px;">Your new verification code is:</p>
            <div style="font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; margin: 20px 0; padding: 20px; background-color: white; border-radius: 8px; border: 2px solid #E5E7EB;">
              ${otpCode}
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            <p style="color: #666; font-size: 14px;">For support, contact us at support@usergy.ai</p>
          </div>
        </div>
      `
    })

    if (emailResponse.error) {
      console.error('Resend API error:', emailResponse.error)
      throw new Error(`Failed to send email: ${emailResponse.error.message}`)
    }

    console.log('Resend OTP email sent successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'New verification code sent successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in handleResendOTP:', error)
    throw error
  }
}
