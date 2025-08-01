
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authService, AuthResult, OTPResult } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  accountType: string | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { signup_source?: string; account_type?: string }) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<OTPResult>;
  resendOTP: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccountType = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('account_types')
        .select('account_type')
        .eq('auth_user_id', userId)
        .single();

      if (!error && data) {
        setAccountType(data.account_type);
      }
    } catch (error) {
      console.error('Error fetching account type:', error);
    }
  }, []);

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session);
      if (session?.user) {
        fetchAccountType(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSession(session);
      if (session?.user) {
        fetchAccountType(session.user.id);
      } else {
        setAccountType(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAccountType]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      accountType,
      loading,
      signUp: authService.signUp,
      signIn: authService.signIn,
      signOut,
      verifyOTP: authService.verifyOTP,
      resendOTP: authService.resendOTP,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
