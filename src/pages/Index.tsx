
import React, { useState, useEffect } from 'react';
import { AuthToggle } from '@/components/AuthToggle';
import { AuthForm } from '@/components/AuthForm';
import { GoogleAuthButton } from '@/components/UsergyCTA';
import { OTPVerification } from '@/components/OTPVerification';
import { NetworkNodes } from '@/components/NetworkNodes';
import heroIllustration from '@/assets/usergy-hero-illustration.png';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAccountType } from '@/hooks/useAccountType';

const Index = () => {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const { toast } = useToast();
  const { user, signUp, signIn } = useAuth();
  const { accountType, isUser, isClient, loading: accountTypeLoading } = useAccountType();
  const navigate = useNavigate();

  // Enhanced redirect logic for authenticated users with retry mechanism
  useEffect(() => {
    if (user && !accountTypeLoading) {
      console.log('User authenticated, checking account type for redirect:', {
        user_id: user.id,
        accountType,
        isUser,
        isClient,
        currentDomain: window.location.hostname,
        userMetadata: user.user_metadata
      });

      // Implement retry mechanism for account type detection
      const attemptRedirect = (attempt = 1) => {
        const maxAttempts = 3;
        const retryDelay = attempt * 1000; // Increasing delay

        setTimeout(async () => {
          // Refresh account type if it's still unknown
          if (!accountType && attempt < maxAttempts) {
            console.log(`Attempt ${attempt}: Account type still unknown, retrying...`);
            return attemptRedirect(attempt + 1);
          }

          // Use metadata as fallback if account type is still not available
          const finalAccountType = accountType || user.user_metadata?.account_type;
          const finalIsUser = finalAccountType === 'user';
          const finalIsClient = finalAccountType === 'client';

          console.log(`Attempt ${attempt}: Final redirect decision:`, {
            finalAccountType,
            finalIsUser,
            finalIsClient
          });

          if (finalIsUser) {
            // User accounts should go to user.usergy.ai
            const userDomain = 'https://user.usergy.ai/profile-completion';
            console.log('Redirecting user account to:', userDomain);
            window.location.href = userDomain;
          } else if (finalIsClient) {
            // Client accounts go to profile completion on current domain
            console.log('Redirecting client account to profile completion');
            navigate('/profile-completion');
          } else {
            // Final fallback - redirect to profile completion and let it handle detection
            console.log('Account type still unknown after retries, redirecting to profile completion for detection');
            navigate('/profile-completion');
          }
        }, retryDelay);
      };

      // Start the redirect attempt process
      attemptRedirect();
    }
  }, [user, accountType, isUser, isClient, accountTypeLoading, navigate]);

  const handleAuthSubmit = async (email: string, password?: string) => {
    if (!password) return;
    setIsLoading(true);
    
    if (authMode === 'signup') {
      console.log('Attempting signup for:', email);
      const { error } = await signUp(email, password);
      
      if (error) {
        console.error('Signup failed:', error);
        
        // Check if it's a duplicate email error
        if (error.includes('already registered') || error.includes('already exists')) {
          toast({
            title: "Email Already Registered",
            description: "This email is already associated with an account. Please sign in instead.",
            variant: "destructive",
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setAuthMode('signin');
                  // Preserve the email in the form
                }}
              >
                Switch to Sign In
              </Button>
            )
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error,
            variant: "destructive"
          });
        }
      } else {
        console.log('Signup successful, showing OTP verification');
        setPendingSignup({
          email,
          password
        });
        setShowOTPVerification(true);
        toast({
          title: "Check your email!",
          description: "We've sent you a verification code to complete your registration."
        });
      }
    } else {
      console.log('Attempting signin for:', email);
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Signin failed:', error);
        toast({
          title: "Sign in failed",
          description: error,
          variant: "destructive"
        });
      } else {
        console.log('Signin successful');
        toast({
          title: "Welcome back!",
          description: "Great to see you again, explorer."
        });
      }
    }
    
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      console.log('Attempting Google OAuth');
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) {
        console.error('Google auth failed:', error);
        toast({
          title: "Google authentication failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Google auth exception:', error);
      toast({
        title: "Authentication error",
        description: "Failed to authenticate with Google",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  // Enhanced OTP success handler with account-type-based redirection
  const handleOTPSuccess = async () => {
    console.log('OTP verification successful, determining redirect...');
    
    try {
      // Get the current user and their account type
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.error('No user found after OTP verification');
        toast({
          title: "Authentication Error",
          description: "Unable to complete authentication. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Check account type from user metadata (most reliable for new users)
      const userAccountType = currentUser.user_metadata?.account_type;
      console.log('OTP Success - User account type from metadata:', userAccountType);
      
      setShowOTPVerification(false);
      setPendingSignup(null);
      
      toast({
        title: "Welcome to Usergy!",
        description: "Your account has been created successfully."
      });

      // Enhanced redirect logic with account type-specific handling
      setTimeout(() => {
        if (userAccountType === 'user') {
          // Redirect user accounts to user.usergy.ai
          const userDomain = 'https://user.usergy.ai/profile-completion';
          console.log('OTP Success: Redirecting user account to:', userDomain);
          window.location.href = userDomain;
        } else if (userAccountType === 'client') {
          // Redirect client accounts to profile completion
          console.log('OTP Success: Redirecting client account to profile completion');
          navigate('/profile-completion');
        } else {
          // Fallback - redirect to profile completion
          console.log('OTP Success: Account type unknown, redirecting to profile completion');
          navigate('/profile-completion');
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error in handleOTPSuccess:', error);
      // Fallback redirect
      setTimeout(() => {
        navigate('/profile-completion');
      }, 1500);
    }
  };

  const handleBackToSignup = () => {
    console.log('Going back to signup form');
    setShowOTPVerification(false);
    setPendingSignup(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <NetworkNodes />
      
      <main className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Hero Content */}
            <article className="text-center lg:text-left animate-fade-in">
              {/* Logo */}
              <header className="mb-8">
                <div className="inline-flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-start to-primary-end rounded-lg flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="6" r="3" />
                      <circle cx="18" cy="18" r="3" />
                      <path d="M8.5 14l7-4" stroke="white" strokeWidth="2" />
                      <path d="M8.5 10l7 4" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
                    Usergy
                  </span>
                </div>
              </header>

              {/* Hero Headlines */}
              <div className="mb-8 space-y-4">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                  Where Innovation
                  <span className="block bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
                    Meets Insight
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  Join a community of digital pioneers shaping tomorrow's products. Your expertise matters - help build the future, one product at a time with our AI-powered user insights platform.
                </p>
              </div>

              {/* Trust Indicators */}
              <aside className="hidden lg:block">
                <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" aria-hidden="true"></div>
                    <span>2,500+ Active Explorers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-start rounded-full animate-pulse" aria-hidden="true"></div>
                    <span>150+ Partner Companies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-end rounded-full animate-pulse" aria-hidden="true"></div>
                    <span>Enterprise Grade Security</span>
                  </div>
                </div>
              </aside>
            </article>

            {/* Right Side - Auth Form */}
            <aside className="animate-slide-up">
              <div className="bg-card/80 backdrop-blur-sm usergy-shadow-strong rounded-3xl p-8 lg:p-10 border border-border/50">
                
                {/* Form Header */}
                <div className="text-center mb-8">
                  {!showOTPVerification && <AuthToggle mode={authMode} onToggle={setAuthMode} />}
                  
                  <div className="mt-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      {showOTPVerification ? 'Verify your email' : authMode === 'signup' ? 'Welcome to where innovation finds its voice' : 'Welcome back to the tech community'}
                    </h2>
                    <p className="text-muted-foreground">
                      {showOTPVerification ? 'Enter the verification code we sent to your email' : authMode === 'signup' ? 'Join thousands of digital explorers already making an impact with paid opportunities' : "We're excited to see you again, explorer"}
                    </p>
                  </div>
                </div>

                {/* Google Auth (only show if not in OTP verification) */}
                {!showOTPVerification && <>
                    <div className="mb-6">
                      <GoogleAuthButton mode={authMode} onClick={handleGoogleAuth} isLoading={isLoading} />
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-card text-muted-foreground">or continue with email</span>
                      </div>
                    </div>
                  </>}

                {/* Email Form or OTP Verification */}
                {showOTPVerification && pendingSignup ? <OTPVerification email={pendingSignup.email} password={pendingSignup.password} onBack={handleBackToSignup} onSuccess={handleOTPSuccess} /> : <AuthForm mode={authMode} onSubmit={handleAuthSubmit} isLoading={isLoading} />}

                {/* Footer Links (only show if not in OTP verification) */}
                {!showOTPVerification && <div className="mt-8 text-center space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {authMode === 'signup' ? <span>
                          Already part of our community?{' '}
                          <button onClick={() => setAuthMode('signin')} className="text-primary hover:text-primary-end font-medium transition-colors duration-300">
                            Welcome back
                          </button>
                        </span> : <span>
                          New here? We'd love to have you{' '}
                          <button onClick={() => setAuthMode('signup')} className="text-primary hover:text-primary-end font-medium transition-colors duration-300">
                            join us
                          </button>
                        </span>}
                    </div>
                    
                    <nav className="flex justify-center space-x-6 text-xs text-muted-foreground">
                      <a href="#" className="hover:text-foreground transition-colors duration-300">Privacy Policy</a>
                      <a href="#" className="hover:text-foreground transition-colors duration-300">Terms of Service</a>
                    </nav>
                  </div>}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
