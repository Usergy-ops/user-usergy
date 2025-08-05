
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
    
    // Set up auth state listener FIRST - this is critical for proper session management
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', { 
          event, 
          session: !!session, 
          user: !!session?.user,
          provider: session?.user?.app_metadata?.provider || session?.user?.user_metadata?.provider
        });
        
        // Always set both session and user together
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only set loading to false after we've processed the auth state
        if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || 
            event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(false);
        }
        
        // Track auth events for monitoring with enhanced OAuth detection
        if (event === 'SIGNED_IN' && session?.user) {
          const isOauthUser = !!(
            session.user.app_metadata?.provider || 
            session.user.user_metadata?.provider ||
            session.user.user_metadata?.iss
          );
          
          trackUserAction('user_signed_in', {
            user_id: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider || session.user.user_metadata?.provider || 'email',
            oauth_signup: isOauthUser,
            is_oauth_user: isOauthUser,
            auth_event: event
          });
        } else if (event === 'SIGNED_OUT') {
          trackUserAction('user_signed_out', {
            auth_event: event
          });
        }
      }
    );

    // THEN check for existing session - this order is critical
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          const isOauthUser = !!(
            session?.user?.app_metadata?.provider || 
            session?.user?.user_metadata?.provider ||
            session?.user?.user_metadata?.iss
          );
          
          console.log('Initial session loaded:', { 
            session: !!session, 
            user: !!session?.user,
            provider: session?.user?.app_metadata?.provider || session?.user?.user_metadata?.provider,
            is_oauth_user: isOauthUser
          });
          
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Use AuthService methods directly with enhanced error handling
  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    try {
      return await AuthService.signUp(email, password);
    } catch (error) {
      console.error('SignUp error in context:', error);
      return { error: 'An unexpected error occurred during signup' };
    }
  };

  const verifyOTP = async (email: string, otp: string, password: string): Promise<AuthResult> => {
    try {
      return await AuthService.verifyOTP(email, otp, password);
    } catch (error) {
      console.error('VerifyOTP error in context:', error);
      return { error: 'An unexpected error occurred during verification' };
    }
  };

  const resendOTP = async (email: string): Promise<AuthResult> => {
    try {
      return await AuthService.resendOTP(email);
    } catch (error) {
      console.error('ResendOTP error in context:', error);
      return { error: 'An unexpected error occurred while resending code' };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      return await AuthService.signIn(email, password);
    } catch (error) {
      console.error('SignIn error in context:', error);
      return { error: 'An unexpected error occurred during signin' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('SignOut error in context:', error);
      // Don't throw here, just log the error
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      return await AuthService.resetPassword(email);
    } catch (error) {
      console.error('ResetPassword error in context:', error);
      return { error: 'An unexpected error occurred during password reset' };
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
