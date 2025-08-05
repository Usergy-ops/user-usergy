/**
 * Enhanced authentication service with progressive rate limiting and OTP verification
 */

import { supabase } from '@/integrations/supabase/client';
import { trackUserAction, trackError } from '@/utils/enhancedMonitoring';
import { validateEmail, validatePassword } from '@/utils/security';

export interface EnhancedAuthResult {
  success?: boolean;
  error?: string;
  user?: any;
  session?: any;
  requiresOTP?: boolean;
  attemptsLeft?: number;
  blocked?: boolean;
  retryAfter?: number;
}

export interface OTPVerificationResult extends EnhancedAuthResult {
  emailSent?: boolean;
  expired?: boolean;
}

class EnhancedAuthService {
  private getSourceUrl(): string {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : '';
  }

  async signUpWithOTP(email: string, password: string, accountType: 'user' | 'client' = 'client'): Promise<OTPVerificationResult> {
    try {
      // Validate inputs
      if (!validateEmail(email)) {
        return { error: 'Please enter a valid email address' };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { error: passwordValidation.errors[0] };
      }

      trackUserAction('signup_otp_initiated', { 
        email, 
        account_type: accountType,
        source_url: this.getSourceUrl()
      });

      // Send OTP via edge function
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          action: 'send',
          password,
          accountType,
          sourceUrl: this.getSourceUrl(),
          userAgent: this.getUserAgent()
        }
      });

      if (error) {
        trackError(new Error(error.message), 'signup_otp_send', { email });
        return { 
          error: 'Failed to send verification code. Please try again.',
          blocked: error.message.includes('blocked') || error.message.includes('Too many')
        };
      }

      if (data.blocked) {
        return {
          error: data.error,
          blocked: true,
          retryAfter: data.retryAfter,
          attemptsLeft: 0
        };
      }

      trackUserAction('signup_otp_sent', { 
        email, 
        account_type: accountType,
        email_sent: data.emailSent 
      });

      return {
        success: true,
        requiresOTP: true,
        emailSent: data.emailSent,
        attemptsLeft: data.attemptsLeft
      };
    } catch (error) {
      trackError(error as Error, 'signup_otp_error', { email });
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  }

  async verifyOTP(email: string, otp: string, password: string): Promise<OTPVerificationResult> {
    try {
      if (!email || !otp || !password) {
        return { error: 'Email, verification code, and password are required' };
      }

      trackUserAction('otp_verification_attempted', { email });

      // Verify OTP via edge function
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          action: 'verify',
          otp: otp.replace(/\s/g, ''), // Remove any spaces
          password,
          accountType: 'client', // Default for now
          sourceUrl: this.getSourceUrl(),
          userAgent: this.getUserAgent()
        }
      });

      if (error) {
        trackError(new Error(error.message), 'otp_verification', { email });
        return { error: 'Verification failed. Please try again.' };
      }

      if (data.blocked) {
        return {
          error: data.error,
          blocked: true,
          attemptsLeft: 0
        };
      }

      if (!data.success) {
        return {
          error: data.error,
          expired: data.expired,
          attemptsLeft: data.attemptsLeft
        };
      }

      trackUserAction('otp_verification_success', { 
        email,
        user_id: data.user?.id 
      });

      // Now sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        trackError(signInError, 'post_otp_signin', { email });
        return { error: 'Account created but sign-in failed. Please try signing in.' };
      }

      return {
        success: true,
        user: signInData.user,
        session: signInData.session
      };
    } catch (error) {
      trackError(error as Error, 'otp_verification_error', { email });
      return { error: 'An unexpected error occurred during verification' };
    }
  }

  async resendOTP(email: string): Promise<OTPVerificationResult> {
    try {
      trackUserAction('otp_resend_requested', { email });

      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          action: 'resend',
          accountType: 'client',
          sourceUrl: this.getSourceUrl(),
          userAgent: this.getUserAgent()
        }
      });

      if (error) {
        trackError(new Error(error.message), 'otp_resend', { email });
        return { error: 'Failed to resend verification code' };
      }

      if (data.blocked) {
        return {
          error: data.error,
          blocked: true,
          retryAfter: data.retryAfter
        };
      }

      trackUserAction('otp_resend_success', { 
        email, 
        email_sent: data.emailSent 
      });

      return {
        success: true,
        emailSent: data.emailSent,
        attemptsLeft: data.attemptsLeft
      };
    } catch (error) {
      trackError(error as Error, 'otp_resend_error', { email });
      return { error: 'Failed to resend verification code' };
    }
  }

  async signIn(email: string, password: string): Promise<EnhancedAuthResult> {
    try {
      if (!validateEmail(email)) {
        return { error: 'Please enter a valid email address' };
      }

      if (!password) {
        return { error: 'Password is required' };
      }

      trackUserAction('signin_attempted', { email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        trackError(error, 'signin_failed', { 
          email, 
          error_code: error.message 
        });

        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Please verify your email address' };
        }
        if (error.message.includes('too many requests')) {
          return { 
            error: 'Too many sign-in attempts. Please wait a moment and try again.',
            blocked: true
          };
        }

        return { error: error.message };
      }

      trackUserAction('signin_success', { 
        email,
        user_id: data.user?.id 
      });

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      trackError(error as Error, 'signin_error', { email });
      return { error: 'An unexpected error occurred during sign-in' };
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        trackError(error, 'signout_error');
        throw error;
      }

      trackUserAction('signout_success');
    } catch (error) {
      trackError(error as Error, 'signout_error');
      throw error;
    }
  }

  async resetPassword(email: string): Promise<EnhancedAuthResult> {
    try {
      if (!validateEmail(email)) {
        return { error: 'Please enter a valid email address' };
      }

      trackUserAction('password_reset_requested', { email });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${this.getSourceUrl()}/auth/reset-password`
      });

      if (error) {
        trackError(error, 'password_reset_failed', { email });
        return { error: 'Failed to send password reset email' };
      }

      trackUserAction('password_reset_sent', { email });

      return {
        success: true
      };
    } catch (error) {
      trackError(error as Error, 'password_reset_error', { email });
      return { error: 'An unexpected error occurred' };
    }
  }
}

export const enhancedAuthService = new EnhancedAuthService();
