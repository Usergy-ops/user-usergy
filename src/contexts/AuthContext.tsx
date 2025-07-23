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
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // Call our edge function to generate OTP
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          password,
          action: 'generate'
        }
      });

      if (error) {
        return { error: error.message || 'Failed to send verification code' };
      }

      if (data.error) {
        return { error: data.error };
      }

      return { error: undefined };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const verifyOTP = async (email: string, otp: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          otp,
          password,
          action: 'verify'
        }
      });

      if (error) {
        return { error: error.message || 'Failed to verify code' };
      }

      if (data.error) {
        return { error: data.error };
      }

      // After successful verification, sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        return { error: signInError.message };
      }

      return { error: undefined };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          email,
          action: 'resend'
        }
      });

      if (error) {
        return { error: error.message || 'Failed to resend code' };
      }

      if (data.error) {
        return { error: data.error };
      }

      return { error: undefined };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      return { error: undefined };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        return { error: error.message };
      }

      return { error: undefined };
    } catch (error) {
      console.error('Reset password error:', error);
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