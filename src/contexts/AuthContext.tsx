
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { monitoring, trackUserAction } from '@/utils/monitoring';
import { ensureUserHasAccountType } from '@/utils/accountTypeUtils';
import { handleAuthSuccessRedirect, debugRedirectContext } from '@/utils/redirectionUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string; attemptsLeft?: number }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  verifyOTP: (email: string, otp: string, password: string) => Promise<{ error?: string; isNewUser?: boolean; accountType?: string }>;
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
    // Debug redirect context on mount
    debugRedirectContext();

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        console.log('Initial session check:', {
          hasSession: !!initialSession,
          userId: initialSession?.user?.id,
          email: initialSession?.user?.email
        });
        
        if (error) {
          console.error('Error getting initial session:', error);
          monitoring.logError(error, 'get_initial_session_error');
        }
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchAccountType(initialSession.user.id);
          await ensureUserHasAccountType(initialSession.user.id);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        monitoring.logError(error as Error, 'get_initial_session_error');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes with enhanced OAuth handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change:', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          userMetadata: currentSession?.user?.user_metadata
        });
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (currentSession?.user) {
          await fetchAccountType(currentSession.user.id);
          
          // Enhanced handling for different auth events
          if (event === 'SIGNED_IN') {
            await ensureUserHasAccountType(currentSession.user.id);
            
            // Check if this is an OAuth sign-in that needs redirect handling
            const userMetadata = currentSession.user.user_metadata;
            const isOAuthUser = userMetadata?.iss || userMetadata?.provider_id;
            
            if (isOAuthUser) {
              console.log('OAuth user detected, handling redirect...');
              setTimeout(async () => {
                const finalAccountType = userMetadata?.account_type || 
                  (currentSession.user.email?.includes('user.usergy.ai') ? 'user' : 'client');
                
                await handleAuthSuccessRedirect(
                  currentSession.user,
                  finalAccountType,
                  true // Assume new user for OAuth initially
                );
              }, 1000);
            }
          } else if (event === 'TOKEN_REFRESHED') {
            await ensureUserHasAccountType(currentSession.user.id);
          }
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

      const type = data?.account_type || null;
      setAccountType(type);
      
      console.log('Account type fetched:', { userId, accountType: type });
    } catch (error) {
      console.error('Error in fetchAccountType:', error);
      monitoring.logError(error as Error, 'fetch_account_type_error', { userId });
      setAccountType(null);
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

      if (data.user) {
        await ensureUserHasAccountType(data.user.id);
        
        // Handle redirect for sign in
        setTimeout(async () => {
          const userAccountType = data.user.user_metadata?.account_type ||
            (data.user.email?.includes('user.usergy.ai') ? 'user' : 'client');
          
          await handleAuthSuccessRedirect(data.user, userAccountType, false);
        }, 1000);
      }

      trackUserAction('signin_success', { email, method: 'password' });
      
      toast({
        title: "Welcome back!",
        description: "Redirecting to your dashboard...",
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

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true);
      monitoring.startTiming('auth_signup');

      // Enhanced context detection for signup
      const sourceUrl = window.location.href;
      const referrerUrl = document.referrer || sourceUrl;
      const urlParams = new URLSearchParams(window.location.search);
      
      // Determine account type with enhanced detection
      let accountType = 'client'; // Default fallback
      let signupSource = 'enhanced_signup';
      
      // Check URL parameters first (highest priority)
      if (urlParams.get('type') === 'user' || urlParams.get('accountType') === 'user') {
        accountType = 'user';
        signupSource = 'enhanced_user_signup';
      } else if (urlParams.get('type') === 'client' || urlParams.get('accountType') === 'client') {
        accountType = 'client';
        signupSource = 'enhanced_client_signup';
      }
      // Check domain/host (second priority)
      else if (sourceUrl.includes('user.usergy.ai') || referrerUrl.includes('user.usergy.ai')) {
        accountType = 'user';
        signupSource = 'enhanced_user_signup';
      } else if (sourceUrl.includes('client.usergy.ai') || referrerUrl.includes('client.usergy.ai')) {
        accountType = 'client';
        signupSource = 'enhanced_client_signup';
      }
      // Check URL paths (third priority)
      else if (sourceUrl.includes('/user')) {
        accountType = 'user';
        signupSource = 'enhanced_user_signup';
      } else if (sourceUrl.includes('/client')) {
        accountType = 'client';
        signupSource = 'enhanced_client_signup';
      }
      
      console.log('Enhanced signup context detection:', {
        sourceUrl,
        referrerUrl,
        urlParams: Object.fromEntries(urlParams),
        detectedAccountType: accountType,
        signupSource,
        providedMetadata: metadata
      });

      const { data, error } = await supabase.functions.invoke('unified-auth', {
        body: {
          action: 'generate',
          email,
          password,
          account_type: accountType,
          signup_source: signupSource,
          source_url: sourceUrl,
          referrer_url: referrerUrl,
          user_metadata: metadata
        }
      });

      monitoring.endTiming('auth_signup');

      if (error) {
        console.error('Signup error:', error);
        monitoring.logError(error, 'signup_error', { email, accountType });
        return { error: error.message || 'Signup failed' };
      }

      if (data?.error) {
        console.error('Signup response error:', data.error);
        return { error: data.error };
      }
      
      trackUserAction('signup_otp_sent', { 
        email, 
        account_type: accountType,
        signup_source: signupSource
      });
      
      return { attemptsLeft: data?.attemptsLeft };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      monitoring.logError(error as Error, 'signup_unexpected_error', { email });
      return { error: 'An unexpected error occurred during signup' };
    } finally {
      setLoading(false);
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

      // Enhanced success handling with redirect
      if (data?.success && data?.user) {
        const isNewUser = data.isNewUser || true;
        const userAccountType = data.accountType || data.user.user_metadata?.account_type;
        
        console.log('OTP verification successful:', {
          email,
          isNewUser,
          accountType: userAccountType,
          userId: data.user.id,
          redirectUrl: data.redirectUrl
        });

        trackUserAction('otp_verification_success', { 
          email, 
          isNewUser,
          accountType: userAccountType
        });

        // Handle redirect after successful OTP verification
        setTimeout(async () => {
          if (data.redirectUrl) {
            console.log('Using provided redirect URL:', data.redirectUrl);
            window.location.href = data.redirectUrl;
          } else {
            await handleAuthSuccessRedirect(data.user, userAccountType, isNewUser);
          }
        }, 1500);

        return { 
          isNewUser, 
          accountType: userAccountType 
        };
      }

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
