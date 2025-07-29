import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { validateEmail, validatePassword } from '@/utils/security';
import { ValidationError, AuthError } from '@/utils/errorHandling';
import { checkRateLimit } from '@/utils/rateLimit';
import { handleCentralizedError, createAuthenticationError, createRateLimitError } from '@/utils/centralizedErrorHandling';
import { monitoring, trackUserAction } from '@/utils/monitoring';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: string | null;
  signUp: (email: string, password: string) => Promise<{ error?: string; attemptsLeft?: number }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<{ error?: string }>;
  resendOTP: (email: string) => Promise<{ error?: string; attemptsLeft?: number }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  refreshAccountType: () => Promise<void>;
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
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  // Function to get user's account type
  const refreshAccountType = async () => {
    if (!user) {
      setAccountType(null);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_account_type', {
        user_id_param: user.id
      });

      if (error) {
        console.error('Error getting account type:', error);
        setAccountType(null);
      } else {
        console.log('Account type retrieved:', data);
        setAccountType(data || null);
      }
    } catch (error) {
      console.error('Error in refreshAccountType:', error);
      setAccountType(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Get account type when user signs in
        if (session?.user) {
          // Defer account type fetch to avoid blocking auth state change
          setTimeout(async () => {
            await refreshAccountType();
          }, 0);
        } else {
          setAccountType(null);
        }
        
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer account type fetch to avoid blocking initial load
        setTimeout(async () => {
          await refreshAccountType();
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update account type when user changes
  useEffect(() => {
    if (user) {
      refreshAccountType();
    }
  }, [user?.id]);

  const signUp = async (email: string, password: string) => {
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
        
        // Handle rate limiting errors
        if (error.message?.includes('Too many')) {
          return { error: error.message };
        }
        
        return { error: authError.message };
      }

      if (data.error) {
        console.error('Sign up data error:', data.error);
        
        // Handle specific error cases
        let userFriendlyMessage = data.error;
        
        if (data.error.includes('User already registered') || data.error.includes('already exists')) {
          userFriendlyMessage = 'This email is already registered. Please sign in instead.';
        }
        
        const authError = createAuthenticationError(userFriendlyMessage);
        await handleCentralizedError(authError, 'auth_signup', undefined, { email });
        
        // Handle rate limiting errors
        if (data.error.includes('Too many')) {
          return { error: data.error };
        }
        
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
  };

  const verifyOTP = async (email: string, otp: string, password: string) => {
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
        
        // Handle rate limiting errors
        if (error.message?.includes('Too many') || error.message?.includes('blocked')) {
          return { error: error.message };
        }
        
        return { error: authError.message };
      }

      if (data.error) {
        console.error('OTP verification data error:', data.error);
        const authError = createAuthenticationError(data.error);
        await handleCentralizedError(authError, 'auth_otp_verify', undefined, { email });
        
        // Handle rate limiting and blocking errors
        if (data.error.includes('Too many') || data.error.includes('blocked')) {
          return { error: data.error };
        }
        
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
  };

  const resendOTP = async (email: string) => {
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
        
        // Handle rate limiting errors
        if (error.message?.includes('Too many')) {
          return { error: error.message };
        }
        
        return { error: authError.message };
      }

      if (data.error) {
        console.error('Resend OTP data error:', data.error);
        const authError = createAuthenticationError(data.error);
        await handleCentralizedError(authError, 'auth_otp_resend', undefined, { email });
        
        // Handle rate limiting errors
        if (data.error.includes('Too many')) {
          return { error: data.error };
        }
        
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
  };

  const signIn = async (email: string, password: string) => {
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
  };

  const signOut = async () => {
    try {
      monitoring.startTiming('auth_signout');
      
      console.log('Signing out user');
      await supabase.auth.signOut();
      
      monitoring.endTiming('auth_signout');
      
      trackUserAction('signout_successful', {});
      
    } catch (error) {
      await handleCentralizedError(error as Error, 'auth_signout');
    }
  };

  const resetPassword = async (email: string) => {
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
  };

  const value = {
    user,
    session,
    loading,
    accountType,
    signUp,
    signIn,
    signOut,
    verifyOTP,
    resendOTP,
    resetPassword,
    refreshAccountType
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
