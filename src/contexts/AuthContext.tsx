
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<{ error?: string }>;
  resendOTP: (email: string) => Promise<{ error?: string }>;
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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
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
      console.log('Starting sign up process for:', email);
      
      // Call our edge function to generate OTP - FIXED: Remove password parameter for generate action
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          action: 'generate'
        }
      });

      console.log('Sign up response:', { data, error });

      if (error) {
        console.error('Sign up error:', error);
        return { error: error.message || 'Failed to send verification code' };
      }

      if (data?.error) {
        console.error('Sign up data error:', data.error);
        return { error: data.error };
      }

      console.log('Sign up successful, OTP sent');
      return { error: undefined };
    } catch (error: any) {
      console.error('Sign up exception:', error);
      return { error: error.message || 'Failed to send verification code' };
    }
  };

  const verifyOTP = async (email: string, otp: string, password: string) => {
    try {
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
        return { error: error.message || 'Failed to verify code' };
      }

      if (data?.error) {
        console.error('OTP verification data error:', data.error);
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
        return { error: signInError.message };
      }

      console.log('User signed in successfully after OTP verification');
      return { error: undefined };
    } catch (error: any) {
      console.error('OTP verification exception:', error);
      return { error: error.message || 'Failed to verify code' };
    }
  };

  const resendOTP = async (email: string) => {
    try {
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
        return { error: error.message || 'Failed to resend code' };
      }

      if (data?.error) {
        console.error('Resend OTP data error:', data.error);
        return { error: data.error };
      }

      console.log('OTP resent successfully');
      return { error: undefined };
    } catch (error: any) {
      console.error('Resend OTP exception:', error);
      return { error: error.message || 'Failed to resend code' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting sign in for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: error.message };
      }

      console.log('Sign in successful');
      return { error: undefined };
    } catch (error: any) {
      console.error('Sign in exception:', error);
      return { error: error.message || 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    console.log('Signing out user');
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Resetting password for:', email);
      
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Reset password error:', error);
        return { error: error.message };
      }

      console.log('Password reset email sent');
      return { error: undefined };
    } catch (error: any) {
      console.error('Reset password exception:', error);
      return { error: error.message || 'An unexpected error occurred' };
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
