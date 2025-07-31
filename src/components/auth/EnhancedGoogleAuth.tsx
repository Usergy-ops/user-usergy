
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2, Shield } from 'lucide-react';
import { monitoring, trackUserAction } from '@/utils/monitoring';

interface EnhancedGoogleAuthProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export const EnhancedGoogleAuth: React.FC<EnhancedGoogleAuthProps> = ({ 
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
      monitoring.startTiming(`enhanced_google_auth_${mode}`);
      
      // Enhanced referrer capture and context detection
      const currentUrl = window.location.href;
      const currentHost = window.location.host;
      const referrerUrl = document.referrer || currentUrl;
      const urlParams = new URLSearchParams(window.location.search);
      
      // Determine account type with enhanced detection logic
      let accountType = 'client'; // Default fallback
      let signupSource = 'enhanced_google_oauth';
      
      // Check URL parameters first
      if (urlParams.get('type') === 'user' || urlParams.get('accountType') === 'user') {
        accountType = 'user';
        signupSource = 'enhanced_user_signup';
      } else if (urlParams.get('type') === 'client' || urlParams.get('accountType') === 'client') {
        accountType = 'client';
        signupSource = 'enhanced_client_signup';
      }
      // Check domain/host
      else if (currentHost.includes('user.usergy.ai')) {
        accountType = 'user';
        signupSource = 'enhanced_user_signup';
      } else if (currentHost.includes('client.usergy.ai')) {
        accountType = 'client';
        signupSource = 'enhanced_client_signup';
      }
      // Check URL paths
      else if (currentUrl.includes('/user') || referrerUrl.includes('user.usergy.ai')) {
        accountType = 'user';
        signupSource = 'enhanced_user_signup';
      } else if (currentUrl.includes('/client') || referrerUrl.includes('client.usergy.ai')) {
        accountType = 'client';
        signupSource = 'enhanced_client_signup';
      }
      
      console.log('Enhanced Google Auth - Context detection:', {
        currentUrl,
        currentHost,
        referrerUrl,
        urlParams: Object.fromEntries(urlParams),
        detectedAccountType: accountType,
        signupSource,
        mode
      });
      
      // Enhanced redirect URL construction with security considerations
      const baseUrl = window.location.origin;
      const redirectTo = mode === 'signup' ? `${baseUrl}/profile-completion` : `${baseUrl}/dashboard`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: undefined, // Allow any domain
          },
          skipBrowserRedirect: false,
          // Enhanced metadata capture
          data: {
            referrer_url: referrerUrl,
            signup_source: signupSource,
            account_type: accountType,
            current_host: currentHost,
            current_path: window.location.pathname,
            auth_mode: mode,
            url_params: Object.fromEntries(urlParams),
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            enhanced_auth: true
          }
        }
      });

      if (error) {
        console.error('Enhanced Google auth error:', error);
        monitoring.logError(error, `enhanced_google_auth_${mode}_error`, {
          error_code: error.message,
          redirect_to: redirectTo,
          referrer_url: referrerUrl,
          account_type: accountType,
          signup_source: signupSource
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

      monitoring.endTiming(`enhanced_google_auth_${mode}`);
      
      trackUserAction(`enhanced_google_auth_${mode}_initiated`, {
        provider: 'google',
        redirect_to: redirectTo,
        mode,
        account_type: accountType,
        signup_source: signupSource,
        referrer_url: referrerUrl,
        enhanced: true
      });
      
      // Show success message for signup
      if (mode === 'signup') {
        toast({
          title: "Account Created!",
          description: "Welcome to Usergy! Please complete your profile.",
        });
      }
      
    } catch (error) {
      monitoring.logError(error as Error, `enhanced_google_auth_${mode}_error`, {
        mode,
        disabled
      });
      
      const errorMessage = error instanceof Error ? error.message : `An unexpected error occurred during ${mode}`;
      console.error('Enhanced Google auth error:', error);
      
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
