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

const Index = () => {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const {
    toast
  } = useToast();
  const {
    user,
    signUp,
    signIn
  } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to appropriate page
  useEffect(() => {
    if (user) {
      console.log('User is authenticated, redirecting to profile completion');
      navigate('/profile-completion');
    }
  }, [user, navigate]);
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
      const {
        error
      } = await supabase.auth.signInWithOAuth({
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
  const handleOTPSuccess = () => {
    console.log('OTP verification successful');
    setShowOTPVerification(false);
    setPendingSignup(null);
    toast({
      title: "Welcome to Usergy!",
      description: "Your account has been created successfully."
    });
  };
  const handleBackToSignup = () => {
    console.log('Going back to signup form');
    setShowOTPVerification(false);
    setPendingSignup(null);
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <NetworkNodes />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Hero Content */}
            <div className="text-center lg:text-left animate-fade-in">
              {/* Logo */}
              <div className="mb-8">
                <div className="inline-flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-start to-primary-end rounded-lg flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
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
              </div>

              {/* Hero Headlines */}
              <div className="mb-8 space-y-4">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                  Where Innovation
                  <span className="block bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
                    Meets Insight
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">Join a community of digital pioneers shaping tomorrow's products. Your expertise matter - help build the future, one product at a time.</p>
              </div>

              {/* Trust Indicators */}
              <div className="hidden lg:block">
                <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span>2,500+ Active Explorers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-start rounded-full animate-pulse"></div>
                    <span>150+ Partner Companies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-end rounded-full animate-pulse"></div>
                    <span>Enterprise Grade Security</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="animate-slide-up">
              <div className="bg-card/80 backdrop-blur-sm usergy-shadow-strong rounded-3xl p-8 lg:p-10 border border-border/50">
                
                {/* Form Header */}
                <div className="text-center mb-8">
                  {!showOTPVerification && <AuthToggle mode={authMode} onToggle={setAuthMode} />}
                  
                  <div className="mt-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      {showOTPVerification ? 'Verify your email' : authMode === 'signup' ? 'Welcome to where innovation finds its voice' : 'Welcome back to the community'}
                    </h2>
                    <p className="text-muted-foreground">
                      {showOTPVerification ? 'Enter the verification code we sent to your email' : authMode === 'signup' ? 'Join thousands of digital explorers already making an impact' : "We're excited to see you again, explorer"}
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
                    
                    <div className="flex justify-center space-x-6 text-xs text-muted-foreground">
                      <a href="#" className="hover:text-foreground transition-colors duration-300">Privacy Policy</a>
                      <a href="#" className="hover:text-foreground transition-colors duration-300">Terms of Service</a>
                    </div>
                  </div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;