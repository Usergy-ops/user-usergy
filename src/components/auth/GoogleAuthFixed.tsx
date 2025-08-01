
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2, Shield } from 'lucide-react';

interface GoogleAuthFixedProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export const GoogleAuthFixed: React.FC<GoogleAuthFixedProps> = ({ 
  mode, 
  onSuccess, 
  onError,
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Enhanced context detection with improved logic
      const currentUrl = window.location.href;
      const currentHost = window.location.host;
      const urlParams = new URLSearchParams(window.location.search);
      
      // Determine account type with enhanced detection logic
      let accountType = 'client'; // Default fallback
      
      // Check URL parameters first (highest priority)
      if (urlParams.get('type') === 'user' || urlParams.get('accountType') === 'user') {
        accountType = 'user';
      } else if (urlParams.get('type') === 'client' || urlParams.get('accountType') === 'client') {
        accountType = 'client';
      }
      // Check domain/host (second priority)
      else if (currentHost.includes('user.usergy.ai')) {
        accountType = 'user';
      } else if (currentHost.includes('client.usergy.ai')) {
        accountType = 'client';
      }
      // Check URL paths (third priority)
      else if (currentUrl.includes('/user')) {
        accountType = 'user';
      } else if (currentUrl.includes('/client')) {
        accountType = 'client';
      }
      
      console.log('Google Auth - Context detection:', {
        currentUrl,
        currentHost,
        urlParams: Object.fromEntries(urlParams),
        detectedAccountType: accountType,
        mode
      });
      
      // Enhanced redirect URL construction with proper domain handling
      const baseUrl = window.location.origin;
      let redirectTo;
      
      if (mode === 'signup') {
        if (accountType === 'user') {
          redirectTo = 'https://user.usergy.ai/profile-completion';
        } else if (accountType === 'client') {
          redirectTo = 'https://client.usergy.ai/profile';
        } else {
          redirectTo = `${baseUrl}/profile-completion`;
        }
      } else {
        // For signin, redirect to dashboard first
        redirectTo = `${baseUrl}/dashboard`;
      }
      
      console.log('Google Auth redirectTo:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        
        // Enhanced error messaging
        let userMessage = `Failed to ${mode} with Google`;
        if (error.message.includes('popup')) {
          userMessage = 'Popup was blocked. Please allow popups and try again.';
        } else if (error.message.includes('network')) {
          userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('cancelled')) {
          userMessage = 'Authentication was cancelled. Please try again.';
        }
        
        toast({
          title: "Authentication Error",
          description: userMessage,
          variant: "destructive"
        });
        
        if (onError) {
          onError(userMessage);
        }
        return;
      }

      // Success callback
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `An unexpected error occurred during ${mode}`;
      console.error('Google auth error:', error);
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleAuth}
      disabled={isLoading || disabled}
      className="w-full flex items-center justify-center space-x-2 border-2 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Chrome className="w-5 h-5" />
          <span>
            {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
          </span>
          <Shield className="w-4 h-4 ml-2 text-muted-foreground" />
        </>
      )}
    </Button>
  );
};
