
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthService, type AuthResult } from '@/services/authService';
import { trackUserAction } from '@/utils/monitoring';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<AuthResult>;
  resendOTP: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
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
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
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
      if (!mounted) return;
      
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting initial session:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Use AuthService methods directly
  const signUp = AuthService.signUp;
  const verifyOTP = AuthService.verifyOTP;
  const resendOTP = AuthService.resendOTP;
  const signIn = AuthService.signIn;
  const signOut = AuthService.signOut;
  const resetPassword = AuthService.resetPassword;

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
