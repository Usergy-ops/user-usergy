
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2, Shield } from 'lucide-react';
import { monitoring, trackUserAction } from '@/utils/monitoring';

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
      
      // Enhanced redirect URL construction
      const baseUrl = window.location.origin;
      const redirectTo = `${baseUrl}/dashboard`;
      
      console.log('Starting Google OAuth with:', { mode, redirectTo, baseUrl });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        monitoring.logError(error, `google_auth_${mode}_error`, {
          error_code: error.message,
          redirect_to: redirectTo,
          base_url: baseUrl
        });
        
        // Enhanced error messaging with specific handling
        let userMessage = `Failed to ${mode} with Google`;
        
        if (error.message.includes('popup')) {
          userMessage = 'Popup was blocked. Please allow popups and try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('cancelled') || error.message.includes('closed')) {
          userMessage = 'Authentication was cancelled. Please try again.';
        } else if (error.message.includes('redirect')) {
          userMessage = 'Redirect configuration error. Please contact support.';
        } else if (error.message.includes('invalid_request')) {
          userMessage = 'OAuth configuration error. Please contact support.';
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
        success: true
      });
      
      console.log('Google OAuth initiated successfully');
      
      // Show appropriate success message
      toast({
        title: mode === 'signup' ? "Account Creation Started" : "Sign In Started",
        description: "Redirecting to Google for authentication...",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      monitoring.logError(error as Error, `google_auth_${mode}_error`, {
        mode,
        disabled,
        base_url: window.location.origin
      });
      
      const errorMessage = error instanceof Error ? error.message : `An unexpected error occurred during ${mode}`;
      console.error('Google auth unexpected error:', error);
      
      toast({
        title: "Authentication Error",
        description: "Unable to connect to Google. Please try again or use email authentication.",
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
          <span>Connecting to Google...</span>
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
