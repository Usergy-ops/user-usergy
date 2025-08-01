
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { monitoring, trackUserAction } from '@/utils/monitoring';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string; attemptsLeft?: number }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<{ error?: string }>;
  resendOTP: (email: string) => Promise<{ error?: string; attemptsLeft?: number }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        console.log('Initial session:', initialSession);
        
        if (error) {
          console.error('Error getting initial session:', error);
          monitoring.logError(error, 'get_initial_session_error');
        }
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchAccountType(initialSession.user.id);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        monitoring.logError(error as Error, 'get_initial_session_error');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change:', event, currentSession);
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (currentSession?.user) {
          await fetchAccountType(currentSession.user.id);
        } else {
          setAccountType(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchAccountType = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('account_types')
        .select('account_type')
        .eq('auth_user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching account type:', error);
        monitoring.logError(error, 'fetch_account_type_error', { userId });
      }

      const type = data?.account_type || 'unknown';
      setAccountType(type);
      
      console.log('Account type fetched:', type);
    } catch (error) {
      console.error('Error in fetchAccountType:', error);
      monitoring.logError(error as Error, 'fetch_account_type_error', { userId });
      setAccountType('unknown');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      monitoring.startTiming('auth_signin');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      monitoring.endTiming('auth_signin');

      if (error) {
        console.error('Sign in error:', error);
        monitoring.logError(error, 'signin_error', { email });
        return { error: error.message };
      }

      trackUserAction('signin_success', { email, method: 'password' });
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return {};
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      monitoring.logError(error as Error, 'signin_unexpected_error', { email });
      return { error: 'An unexpected error occurred during sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const sourceUrl = window.location.href;
      const accountType = sourceUrl.includes('user.usergy.ai') ? 'user' : 'client';
      
      const { data, error } = await supabase.functions.invoke('unified-auth', {
        body: {
          action: 'generate',
          email,
          password,
          account_type: accountType,
          signup_source: `${accountType}_signup`
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: error.message || 'Signup failed' };
    }
  };

  const verifyOTP = async (email: string, otp: string, password: string) => {
    try {
      setLoading(true);
      monitoring.startTiming('auth_verify_otp');

      const { data, error } = await supabase.functions.invoke('unified-auth', {
        body: {
          action: 'verify',
          email,
          otp,
          password
        }
      });

      monitoring.endTiming('auth_verify_otp');

      if (error) {
        console.error('OTP verification error:', error);
        monitoring.logError(error, 'otp_verify_error', { email });
        return { error: error.message || 'Failed to verify code' };
      }

      if (data?.error) {
        console.error('OTP verification response error:', data.error);
        return { error: data.error };
      }

      // If verification successful, the auth state change will be handled by the listener
      trackUserAction('otp_verification_success', { email });

      return {};
    } catch (error) {
      console.error('Unexpected OTP verification error:', error);
      monitoring.logError(error as Error, 'otp_verify_unexpected_error', { email });
      return { error: 'An unexpected error occurred during verification' };
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async (email: string) => {
    try {
      setLoading(true);
      monitoring.startTiming('auth_resend_otp');

      const { data, error } = await supabase.functions.invoke('unified-auth', {
        body: {
          action: 'resend',
          email
        }
      });

      monitoring.endTiming('auth_resend_otp');

      if (error) {
        console.error('OTP resend error:', error);
        monitoring.logError(error, 'otp_resend_error', { email });
        return { error: error.message || 'Failed to resend code' };
      }

      if (data?.error) {
        console.error('OTP resend response error:', data.error);
        return { error: data.error };
      }

      trackUserAction('otp_resend_success', { email });

      return { attemptsLeft: data?.attemptsLeft };
    } catch (error) {
      console.error('Unexpected OTP resend error:', error);
      monitoring.logError(error as Error, 'otp_resend_unexpected_error', { email });
      return { error: 'An unexpected error occurred during resend' };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      monitoring.startTiming('auth_reset_password');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      monitoring.endTiming('auth_reset_password');

      if (error) {
        console.error('Password reset error:', error);
        monitoring.logError(error, 'password_reset_error', { email });
        return { error: error.message };
      }

      trackUserAction('password_reset_sent', { email });

      return {};
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      monitoring.logError(error as Error, 'password_reset_unexpected_error', { email });
      return { error: 'An unexpected error occurred during password reset' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      monitoring.startTiming('auth_signout');

      const { error } = await supabase.auth.signOut();

      monitoring.endTiming('auth_signout');

      if (error) {
        console.error('Sign out error:', error);
        monitoring.logError(error, 'signout_error');
      } else {
        trackUserAction('signout_success');
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setAccountType(null);
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      monitoring.logError(error as Error, 'signout_unexpected_error');
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    accountType,
    signIn,
    signUp,
    signOut,
    resetPassword,
    verifyOTP,
    resendOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
