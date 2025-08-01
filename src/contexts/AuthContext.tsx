
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  accountType: string | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { signup_source?: string; account_type?: string }) => Promise<{ error: string | null; attemptsLeft?: number }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<{ error: string | null; isNewUser?: boolean; accountType?: string }>;
  resendOTP: (email: string) => Promise<{ error: string | null; attemptsLeft?: number }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the provider
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

  const signUp = async (email: string, password: string, metadata?: { signup_source?: string; account_type?: string }) => {
    try {
      const sourceDomain = window.location.origin;
      
      const response = await fetch(`https://lnsyrmpucmllakuuiixe.supabase.co/functions/v1/unified-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuc3lybXB1Y21sbGFrdXVpaXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTI5MjQsImV4cCI6MjA2ODkyODkyNH0.kgdtlLTMLEHMBidAAB7fqP9_RhPXsqwI2Tv-TmmyF3Y`
        },
        body: JSON.stringify({
          action: 'signup',
          email,
          password,
          source_domain: sourceDomain,
          account_type: metadata?.account_type || 'client',
          signup_source: metadata?.signup_source || 'enhanced_auth_form'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Signup failed' };
      }
      return { error: null, attemptsLeft: data.attemptsLeft };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  const verifyOTP = async (email: string, otp: string, password: string) => {
    try {
      const sourceDomain = window.location.origin;
      
      const response = await fetch(`https://lnsyrmpucmllakuuiixe.supabase.co/functions/v1/unified-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuc3lybXB1Y21sbGFrdXVpaXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTI5MjQsImV4cCI6MjA2ODkyODkyNH0.kgdtlLTMLEHMBidAAB7fqP9_RhPXsqwI2Tv-TmmyF3Y`
        },
        body: JSON.stringify({
          action: 'verify',
          email,
          password,
          otp,
          source_domain: sourceDomain
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Verification failed' };
      }
      
      // Auto sign in after verification
      await supabase.auth.signInWithPassword({ email, password });
      return { 
        error: null, 
        isNewUser: data.isNewUser, 
        accountType: data.accountType 
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const response = await fetch(`https://lnsyrmpucmllakuuiixe.supabase.co/functions/v1/unified-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuc3lybXB1Y21sbGFrdXVpaXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTI5MjQsImV4cCI6MjA2ODkyODkyNH0.kgdtlLTMLEHMBidAAB7fqP9_RhPXsqwI2Tv-TmmyF3Y`
        },
        body: JSON.stringify({
          action: 'resend',
          email
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Resend failed' };
      }
      
      return { error: null, attemptsLeft: data.attemptsLeft };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  };

  const resetPassword = async (email: string) => {
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
      signUp,
      signIn,
      signOut,
      verifyOTP,
      resendOTP,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
