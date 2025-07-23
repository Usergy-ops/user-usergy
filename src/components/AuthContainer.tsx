
import React, { useState } from 'react';
import { AuthToggle } from './AuthToggle';
import { AuthForm } from './AuthForm';
import { GoogleAuthButton } from './UsergyCTA';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AuthContainer: React.FC = () => {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleFormSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      if (mode === 'signup') {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        toast({
          title: "Google sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: "Google sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      {/* Toggle between Sign Up and Sign In */}
      <AuthToggle mode={mode} onToggle={setMode} />
      
      {/* Google OAuth Button */}
      <GoogleAuthButton
        mode={mode}
        onClick={handleGoogleAuth}
        isLoading={isGoogleLoading}
      />
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-4 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>
      
      {/* Email/Password Form */}
      <AuthForm
        mode={mode}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};
