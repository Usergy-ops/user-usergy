
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2, Shield } from 'lucide-react';
import { monitoring, trackUserAction } from '@/utils/monitoring';
import { assignAccountTypeByDomain } from '@/utils/accountTypeUtils';

interface GoogleAuthProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({ 
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
      monitoring.startTiming(`google_auth_${mode}`);
      
      // Capture referrer information
      const currentUrl = window.location.href;
      const currentHost = window.location.host;
      const referrerUrl = document.referrer || currentUrl;
      
      // Determine account type based on current domain/portal
      let accountType = 'client'; // Default fallback
      let signupSource = 'google_oauth';
      
      if (currentHost.includes('user.usergy.ai')) {
        accountType = 'user';
        signupSource = 'user_signup';
      } else if (currentHost.includes('client.usergy.ai')) {
        accountType = 'client';
        signupSource = 'client_signup';
      } else if (currentUrl.includes('/user') || referrerUrl.includes('user.usergy.ai')) {
        accountType = 'user';
        signupSource = 'user_signup';
      } else if (currentUrl.includes('/client') || referrerUrl.includes('client.usergy.ai')) {
        accountType = 'client';
        signupSource = 'client_signup';
      }
      
      console.log('Google Auth - Detected context:', {
        currentUrl,
        currentHost,
        referrerUrl,
        detectedAccountType: accountType,
        signupSource,
        mode
      });
      
      // Enhanced redirect URL construction
      const baseUrl = window.location.origin;
      const redirectTo = mode === 'signup' ? `${baseUrl}/profile-completion` : `${baseUrl}/dashboard`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
          // Pass referrer and context information through OAuth metadata
          // This will be available in the auth user metadata after signup
          data: {
            referrer_url: referrerUrl,
            signup_source: signupSource,
            account_type: accountType,
            current_host: currentHost,
            auth_mode: mode,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        monitoring.logError(error, `google_auth_${mode}_error`, {
          error_code: error.message,
          redirect_to: redirectTo,
          referrer_url: referrerUrl,
          account_type: accountType
        });
        
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

      monitoring.endTiming(`google_auth_${mode}`);
      
      trackUserAction(`google_auth_${mode}_initiated`, {
        provider: 'google',
        redirect_to: redirectTo,
        mode,
        account_type: accountType,
        signup_source: signupSource,
        referrer_url: referrerUrl
      });
      
      // Show success message for signup
      if (mode === 'signup') {
        toast({
          title: "Account Created!",
          description: "Welcome to Usergy! Please complete your profile.",
        });
      }
      
    } catch (error) {
      monitoring.logError(error as Error, `google_auth_${mode}_error`, {
        mode,
        disabled
      });
      
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
