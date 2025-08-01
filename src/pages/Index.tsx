
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

  // Enhanced redirect logic
  useEffect(() => {
    if (!accountTypeLoading && user && accountType) {
      const redirectUrl = accountType === 'user' 
        ? 'https://user.usergy.ai/profile-completion'
        : 'https://client.usergy.ai/profile';
      
      console.log(`Redirecting ${accountType} to ${redirectUrl}`);
      window.location.href = redirectUrl;
    }
  }, [user, accountType, accountTypeLoading]);

  const handleAuthSubmit = async (email: string, password?: string) => {
    if (!password) return;
    setIsLoading(true);
    
    try {
      if (authMode === 'signup') {
        const { error } = await signUp(email, password);
        
        if (error) {
          if (error.includes('already registered') || error.includes('already exists')) {
            toast({
              title: "Email Already Registered",
              description: "This email is already associated with an account. Please sign in instead.",
              variant: "destructive",
              action: (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAuthMode('signin')}
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
          setPendingSignup({ email, password });
          setShowOTPVerification(true);
          toast({
            title: "Check your email!",
            description: "We've sent you a verification code to complete your registration."
          });
        }
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          toast({
            title: "Sign in failed",
            description: error,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "Great to see you again!"
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        toast({
          title: "Google authentication failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = async () => {
    setShowOTPVerification(false);
    setPendingSignup(null);
    toast({
      title: "Welcome to Usergy!",
      description: "Your account has been created successfully."
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Background Network Animation */}
      <NetworkNodes />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Hero Content */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-start p-12 xl:p-16">
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-6 leading-tight">
              Connect with AI Experts Worldwide
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Join thousands of professionals who are shaping the future of AI. 
              Whether you're an expert looking for projects or a company seeking talent, 
              Usergy connects you with the right opportunities.
            </p>
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">10,000+ Active Experts</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">500+ Companies</span>
              </div>
            </div>
          </div>
          
          {/* Hero Illustration */}
          <div className="mt-8 opacity-80">
            <img 
              src={heroIllustration} 
              alt="Usergy Platform Illustration"
              className="w-full max-w-md h-auto"
            />
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Hero Text */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Welcome to Usergy
              </h1>
              <p className="text-muted-foreground">
                Connect with AI experts worldwide
              </p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm usergy-shadow-strong rounded-3xl p-8 border border-border/50">
              {!showOTPVerification ? (
                <>
                  <div className="text-center mb-8">
                    <AuthToggle 
                      authMode={authMode} 
                      onToggle={(mode) => setAuthMode(mode)} 
                    />
                  </div>

                  <div className="space-y-6">
                    <GoogleAuthButton 
                      mode={authMode}
                      onClick={handleGoogleAuth}
                      isLoading={isLoading}
                    />
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with email
                        </span>
                      </div>
                    </div>

                    <AuthForm
                      mode={authMode}
                      onSubmit={handleAuthSubmit}
                      isLoading={isLoading}
                    />
                  </div>
                </>
              ) : (
                <OTPVerification
                  email={pendingSignup?.email || ''}
                  password={pendingSignup?.password || ''}
                  onSuccess={handleOTPSuccess}
                  onBack={() => setShowOTPVerification(false)}
                />
              )}
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>
                By signing up, you agree to our{' '}
                <a href="/terms" className="underline hover:text-foreground transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="underline hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
