
/**
 * Authentication service - handles all auth operations
 */

import { supabase } from '@/integrations/supabase/client';
import { validateEmail, validatePassword } from '@/utils/security';
import { checkRateLimit } from '@/utils/rateLimit';
import { handleCentralizedError, createAuthenticationError, createRateLimitError } from '@/utils/centralizedErrorHandling';
import { monitoring, trackUserAction } from '@/utils/monitoring';

export interface AuthResult {
  error?: string;
  attemptsLeft?: number;
}

export class AuthService {
  static async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      monitoring.startTiming('auth_signup');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'signup');
      if (!rateLimitResult.allowed) {
        const error = createRateLimitError(
          `Too many signup attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`,
          'signup'
        );
        await handleCentralizedError(error, 'auth_signup', undefined, { email });
        return { 
          error: error.message,
          attemptsLeft: rateLimitResult.attemptsRemaining
        };
      }

      // Validate input
      if (!validateEmail(email)) {
        const error = createAuthenticationError('Invalid email format');
        await handleCentralizedError(error, 'auth_signup', undefined, { email });
        return { error: error.message };
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        const error = createAuthenticationError(passwordValidation.errors.join(', '));
        await handleCentralizedError(error, 'auth_signup', undefined, { email });
        return { error: error.message };
      }

      console.log('Starting sign up process for:', email);
      
      // Call our edge function to generate OTP
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          password,
          action: 'generate'
        }
      });

      console.log('Sign up response:', { data, error });

      if (error) {
        console.error('Sign up error:', error);
        
        // Handle specific error cases
        let userFriendlyMessage = error.message || 'Failed to send verification code';
        
        if (error.message?.includes('User already registered')) {
          userFriendlyMessage = 'This email is already registered. Please sign in instead.';
        } else if (error.message?.includes('duplicate key value')) {
          userFriendlyMessage = 'An account with this email already exists. Please sign in.';
        }
        
        const authError = createAuthenticationError(userFriendlyMessage);
        await handleCentralizedError(authError, 'auth_signup', undefined, { email });
        
        return { error: authError.message };
      }

      if (data.error) {
        console.error('Sign up data error:', data.error);
        
        let userFriendlyMessage = data.error;
        
        if (data.error.includes('User already registered') || data.error.includes('already exists')) {
          userFriendlyMessage = 'This email is already registered. Please sign in instead.';
        }
        
        const authError = createAuthenticationError(userFriendlyMessage);
        await handleCentralizedError(authError, 'auth_signup', undefined, { email });
        
        return { error: authError.message };
      }

      console.log('Sign up successful, OTP sent');
      monitoring.endTiming('auth_signup');
      
      trackUserAction('signup_initiated', {
        email,
        attempts_left: rateLimitResult.attemptsRemaining
      });
      
      return { 
        error: undefined, 
        attemptsLeft: data.attemptsLeft 
      };
    } catch (error) {
      const authError = createAuthenticationError('An unexpected error occurred during signup');
      await handleCentralizedError(error as Error, 'auth_signup', undefined, { email });
      return { error: authError.message };
    }
  }

  static async verifyOTP(email: string, otp: string, password: string): Promise<AuthResult> {
    try {
      monitoring.startTiming('auth_otp_verify');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'otp_verify');
      if (!rateLimitResult.allowed) {
        const error = createRateLimitError(
          `Too many OTP verification attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`,
          'otp_verify'
        );
        await handleCentralizedError(error, 'auth_otp_verify', undefined, { email });
        return { error: error.message };
      }

      // Validate input
      if (!validateEmail(email)) {
        const error = createAuthenticationError('Invalid email format');
        await handleCentralizedError(error, 'auth_otp_verify', undefined, { email });
        return { error: error.message };
      }
      
      if (!otp || otp.length !== 6) {
        const error = createAuthenticationError('OTP must be 6 digits');
        await handleCentralizedError(error, 'auth_otp_verify', undefined, { email });
        return { error: error.message };
      }

      console.log('Starting OTP verification for:', email);
      
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          otp,
          password,
          action: 'verify'
        }
      });

      console.log('OTP verification response:', { data, error });

      if (error) {
        console.error('OTP verification error:', error);
        const authError = createAuthenticationError(error.message || 'Failed to verify code');
        await handleCentralizedError(authError, 'auth_otp_verify', undefined, { email });
        return { error: authError.message };
      }

      if (data.error) {
        console.error('OTP verification data error:', data.error);
        const authError = createAuthenticationError(data.error);
        await handleCentralizedError(authError, 'auth_otp_verify', undefined, { email });
        return { error: authError.message };
      }

      // After successful verification, sign in the user
      console.log('OTP verified, signing in user');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Post-verification sign in error:', signInError);
        const authError = createAuthenticationError(signInError.message);
        await handleCentralizedError(authError, 'auth_post_verification_signin', undefined, { email });
        return { error: authError.message };
      }

      console.log('User signed in successfully after OTP verification');
      monitoring.endTiming('auth_otp_verify');
      
      trackUserAction('otp_verified', {
        email,
        attempts_remaining: rateLimitResult.attemptsRemaining
      });
      
      return { error: undefined };
    } catch (error) {
      const authError = createAuthenticationError('An unexpected error occurred during OTP verification');
      await handleCentralizedError(error as Error, 'auth_otp_verify', undefined, { email });
      return { error: authError.message };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      monitoring.startTiming('auth_signin');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'signin');
      if (!rateLimitResult.allowed) {
        const error = createRateLimitError(
          `Too many signin attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`,
          'signin'
        );
        await handleCentralizedError(error, 'auth_signin', undefined, { email });
        return { error: error.message };
      }

      // Validate input
      if (!validateEmail(email)) {
        const error = createAuthenticationError('Invalid email format');
        await handleCentralizedError(error, 'auth_signin', undefined, { email });
        return { error: error.message };
      }
      
      if (!password) {
        const error = createAuthenticationError('Password is required');
        await handleCentralizedError(error, 'auth_signin', undefined, { email });
        return { error: error.message };
      }

      console.log('Starting sign in for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        const authError = createAuthenticationError(error.message);
        await handleCentralizedError(authError, 'auth_signin', undefined, { email });
        return { error: authError.message };
      }

      console.log('Sign in successful');
      monitoring.endTiming('auth_signin');
      
      trackUserAction('signin_successful', {
        email,
        attempts_remaining: rateLimitResult.attemptsRemaining
      });
      
      return { error: undefined };
    } catch (error) {
      const authError = createAuthenticationError('An unexpected error occurred during signin');
      await handleCentralizedError(error as Error, 'auth_signin', undefined, { email });
      return { error: authError.message };
    }
  }

  static async resendOTP(email: string): Promise<AuthResult> {
    try {
      monitoring.startTiming('auth_otp_resend');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'otp_resend');
      if (!rateLimitResult.allowed) {
        const error = createRateLimitError(
          `Too many OTP resend attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`,
          'otp_resend'
        );
        await handleCentralizedError(error, 'auth_otp_resend', undefined, { email });
        return { error: error.message };
      }

      // Validate input
      if (!validateEmail(email)) {
        const error = createAuthenticationError('Invalid email format');
        await handleCentralizedError(error, 'auth_otp_resend', undefined, { email });
        return { error: error.message };
      }

      console.log('Resending OTP for:', email);
      
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          action: 'resend'
        }
      });

      console.log('Resend OTP response:', { data, error });

      if (error) {
        console.error('Resend OTP error:', error);
        const authError = createAuthenticationError(error.message || 'Failed to resend code');
        await handleCentralizedError(authError, 'auth_otp_resend', undefined, { email });
        return { error: authError.message };
      }

      if (data.error) {
        console.error('Resend OTP data error:', data.error);
        const authError = createAuthenticationError(data.error);
        await handleCentralizedError(authError, 'auth_otp_resend', undefined, { email });
        return { error: authError.message };
      }

      console.log('OTP resent successfully');
      monitoring.endTiming('auth_otp_resend');
      
      trackUserAction('otp_resent', {
        email,
        attempts_left: rateLimitResult.attemptsRemaining
      });
      
      return { 
        error: undefined, 
        attemptsLeft: data.attemptsLeft 
      };
    } catch (error) {
      const authError = createAuthenticationError('An unexpected error occurred during OTP resend');
      await handleCentralizedError(error as Error, 'auth_otp_resend', undefined, { email });
      return { error: authError.message };
    }
  }

  static async resetPassword(email: string): Promise<AuthResult> {
    try {
      monitoring.startTiming('auth_password_reset');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'password_reset');
      if (!rateLimitResult.allowed) {
        const error = createRateLimitError(
          `Too many password reset attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`,
          'password_reset'
        );
        await handleCentralizedError(error, 'auth_password_reset', undefined, { email });
        return { error: error.message };
      }

      // Validate input
      if (!validateEmail(email)) {
        const error = createAuthenticationError('Invalid email format');
        await handleCentralizedError(error, 'auth_password_reset', undefined, { email });
        return { error: error.message };
      }

      console.log('Resetting password for:', email);
      
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Reset password error:', error);
        const authError = createAuthenticationError(error.message);
        await handleCentralizedError(authError, 'auth_password_reset', undefined, { email });
        return { error: authError.message };
      }

      console.log('Password reset email sent');
      monitoring.endTiming('auth_password_reset');
      
      trackUserAction('password_reset_requested', {
        email,
        attempts_remaining: rateLimitResult.attemptsRemaining
      });
      
      return { error: undefined };
    } catch (error) {
      const authError = createAuthenticationError('An unexpected error occurred during password reset');
      await handleCentralizedError(error as Error, 'auth_password_reset', undefined, { email });
      return { error: authError.message };
    }
  }

  static async signOut(): Promise<void> {
    try {
      monitoring.startTiming('auth_signout');
      
      console.log('Signing out user');
      await supabase.auth.signOut();
      
      monitoring.endTiming('auth_signout');
      
      trackUserAction('signout_successful', {});
      
    } catch (error) {
      await handleCentralizedError(error as Error, 'auth_signout');
    }
  }
}
