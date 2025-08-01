// src/pages/Index.tsx
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

  // Your existing JSX remains the same...
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Your existing JSX structure */}
    </div>
  );
};

export default Index;