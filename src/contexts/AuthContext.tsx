
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { validateEmail, validatePassword } from '@/utils/security';
import { ValidationError, AuthError } from '@/utils/errorHandling';
import { checkRateLimit } from '@/utils/consistentRateLimiting';
import { monitoring, trackUserAction } from '@/utils/monitoring';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string; attemptsLeft?: number }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<{ error?: string }>;
  resendOTP: (email: string) => Promise<{ error?: string; attemptsLeft?: number }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Track auth events
        if (event === 'SIGNED_IN' && session?.user) {
          trackUserAction('user_signed_in', {
            user_id: session.user.id,
            email: session.user.email
          });
        } else if (event === 'SIGNED_OUT') {
          trackUserAction('user_signed_out', {});
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      monitoring.startTiming('auth_signup');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'signup');
      if (!rateLimitResult.allowed) {
        return { 
          error: `Too many signup attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`,
          attemptsLeft: rateLimitResult.attemptsRemaining
        };
      }

      // Validate input
      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(passwordValidation.errors.join(', '));
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
        monitoring.logError(error, 'auth_signup_error', { email });
        
        // Handle rate limiting errors
        if (error.message?.includes('Too many')) {
          return { error: error.message };
        }
        
        return { error: error.message || 'Failed to send verification code' };
      }

      if (data.error) {
        console.error('Sign up data error:', data.error);
        monitoring.logError(new Error(data.error), 'auth_signup_data_error', { email });
        
        // Handle rate limiting errors
        if (data.error.includes('Too many')) {
          return { error: data.error };
        }
        
        return { error: data.error };
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
      monitoring.logError(error as Error, 'auth_signup_error', { email });
      
      if (error instanceof ValidationError) {
        return { error: error.message };
      }
      handleError(error, 'AuthContext.signUp');
      return { error: 'An unexpected error occurred' };
    }
  };

  const verifyOTP = async (email: string, otp: string, password: string) => {
    try {
      monitoring.startTiming('auth_otp_verify');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'otp_verify');
      if (!rateLimitResult.allowed) {
        return { 
          error: `Too many OTP verification attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`
        };
      }

      // Validate input
      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }
      
      if (!otp || otp.length !== 6) {
        throw new ValidationError('OTP must be 6 digits');
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
        monitoring.logError(error, 'auth_otp_verify_error', { email });
        
        // Handle rate limiting errors
        if (error.message?.includes('Too many') || error.message?.includes('blocked')) {
          return { error: error.message };
        }
        
        return { error: error.message || 'Failed to verify code' };
      }

      if (data.error) {
        console.error('OTP verification data error:', data.error);
        monitoring.logError(new Error(data.error), 'auth_otp_verify_data_error', { email });
        
        // Handle rate limiting and blocking errors
        if (data.error.includes('Too many') || data.error.includes('blocked')) {
          return { error: data.error };
        }
        
        return { error: data.error };
      }

      // After successful verification, sign in the user
      console.log('OTP verified, signing in user');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Post-verification sign in error:', signInError);
        monitoring.logError(signInError, 'auth_post_verification_signin_error', { email });
        return { error: signInError.message };
      }

      console.log('User signed in successfully after OTP verification');
      monitoring.endTiming('auth_otp_verify');
      
      trackUserAction('otp_verified', {
        email,
        attempts_remaining: rateLimitResult.attemptsRemaining
      });
      
      return { error: undefined };
    } catch (error) {
      monitoring.logError(error as Error, 'auth_otp_verify_error', { email });
      
      if (error instanceof ValidationError) {
        return { error: error.message };
      }
      handleError(error, 'AuthContext.verifyOTP');
      return { error: 'An unexpected error occurred' };
    }
  };

  const resendOTP = async (email: string) => {
    try {
      monitoring.startTiming('auth_otp_resend');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'otp_resend');
      if (!rateLimitResult.allowed) {
        return { 
          error: `Too many OTP resend attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`
        };
      }

      // Validate input
      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
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
        monitoring.logError(error, 'auth_otp_resend_error', { email });
        
        // Handle rate limiting errors
        if (error.message?.includes('Too many')) {
          return { error: error.message };
        }
        
        return { error: error.message || 'Failed to resend code' };
      }

      if (data.error) {
        console.error('Resend OTP data error:', data.error);
        monitoring.logError(new Error(data.error), 'auth_otp_resend_data_error', { email });
        
        // Handle rate limiting errors
        if (data.error.includes('Too many')) {
          return { error: data.error };
        }
        
        return { error: data.error };
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
      monitoring.logError(error as Error, 'auth_otp_resend_error', { email });
      
      if (error instanceof ValidationError) {
        return { error: error.message };
      }
      handleError(error, 'AuthContext.resendOTP');
      return { error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      monitoring.startTiming('auth_signin');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'signin');
      if (!rateLimitResult.allowed) {
        return { 
          error: `Too many signin attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`
        };
      }

      // Validate input
      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }
      
      if (!password) {
        throw new ValidationError('Password is required');
      }

      console.log('Starting sign in for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        monitoring.logError(error, 'auth_signin_error', { email });
        return { error: error.message };
      }

      console.log('Sign in successful');
      monitoring.endTiming('auth_signin');
      
      trackUserAction('signin_successful', {
        email,
        attempts_remaining: rateLimitResult.attemptsRemaining
      });
      
      return { error: undefined };
    } catch (error) {
      monitoring.logError(error as Error, 'auth_signin_error', { email });
      
      if (error instanceof ValidationError) {
        return { error: error.message };
      }
      handleError(error, 'AuthContext.signIn');
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      monitoring.startTiming('auth_signout');
      
      console.log('Signing out user');
      await supabase.auth.signOut();
      
      monitoring.endTiming('auth_signout');
      
      trackUserAction('signout_successful', {});
      
    } catch (error) {
      monitoring.logError(error as Error, 'auth_signout_error', {});
      handleError(error, 'AuthContext.signOut');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      monitoring.startTiming('auth_password_reset');
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(email, 'password_reset');
      if (!rateLimitResult.allowed) {
        return { 
          error: `Too many password reset attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)} seconds.`
        };
      }

      // Validate input
      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      console.log('Resetting password for:', email);
      
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Reset password error:', error);
        monitoring.logError(error, 'auth_password_reset_error', { email });
        return { error: error.message };
      }

      console.log('Password reset email sent');
      monitoring.endTiming('auth_password_reset');
      
      trackUserAction('password_reset_requested', {
        email,
        attempts_remaining: rateLimitResult.attemptsRemaining
      });
      
      return { error: undefined };
    } catch (error) {
      monitoring.logError(error as Error, 'auth_password_reset_error', { email });
      
      if (error instanceof ValidationError) {
        return { error: error.message };
      }
      handleError(error, 'AuthContext.resetPassword');
      return { error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    verifyOTP,
    resendOTP,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
