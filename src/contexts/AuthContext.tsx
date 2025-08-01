// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  accountType: string | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<{ error: string | null }>;
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

  const signUp = async (email: string, password: string) => {
    try {
      const sourceDomain = window.location.origin;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'signup',
          email,
          password,
          source_domain: sourceDomain
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Signup failed' };
      }
      return { error: null };
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
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
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
      return { error: null };
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
      if (session?.user) {
        fetchAccountType(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
      accountType,
      loading,
      signUp,
      signIn,
      signOut,
      verifyOTP,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};