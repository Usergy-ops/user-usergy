
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
      
      // Enhanced redirect URL construction with security considerations
      const baseUrl = window.location.origin;
      const redirectTo = mode === 'signup' ? `${baseUrl}/profile-completion` : `${baseUrl}/dashboard`;
      
      console.log('Starting Enhanced Google OAuth with:', { mode, redirectTo, baseUrl });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: undefined, // Allow any domain
          },
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('Enhanced Google auth error:', error);
        monitoring.logError(error, `enhanced_google_auth_${mode}_error`, {
          error_code: error.message,
          redirect_to: redirectTo
        });
        
        // Enhanced error messaging
        let userMessage = `Failed to ${mode} with Google`;
        if (error.message.includes('popup')) {
          userMessage = 'Popup was blocked. Please allow popups and try again.';
        } else if (error.message.includes('network')) {
          userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('cancelled')) {
          userMessage = 'Authentication was cancelled. Please try again.';
        } else if (error.message.includes('redirect')) {
          userMessage = 'OAuth redirect error. Please contact support if this persists.';
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
        mode
      });
      
      console.log('Enhanced Google OAuth initiated successfully');
      
      // Show success message for signup
      if (mode === 'signup') {
        toast({
          title: "Account Created!",
          description: "Welcome to Usergy! Redirecting you to complete your profile.",
        });
      } else {
        toast({
          title: "Welcome Back!",
          description: "Successfully signed in with Google.",
        });
      }
      
      if (onSuccess) {
        onSuccess();
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
        description: "Unable to connect to Google. Please try again or contact support.",
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
