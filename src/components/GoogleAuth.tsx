
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2 } from 'lucide-react';
import { monitoring, trackUserAction } from '@/utils/monitoring';

interface GoogleAuthProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({ mode, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      monitoring.startTiming(`google_auth_${mode}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        monitoring.logError(error, `google_auth_${mode}_error`, {
          error_code: error.message
        });
        
        const errorMessage = error.message || `Failed to ${mode} with Google`;
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive"
        });
        
        if (onError) {
          onError(errorMessage);
        }
        return;
      }

      monitoring.endTiming(`google_auth_${mode}`);
      
      trackUserAction(`google_auth_${mode}_initiated`, {
        provider: 'google',
        redirect_to: 'dashboard'
      });
      
      // Note: The actual success will be handled by the auth state change
      // in the AuthContext, so we don't call onSuccess here immediately
      
    } catch (error) {
      monitoring.logError(error as Error, `google_auth_${mode}_error`, {
        mode
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
      disabled={isLoading}
      className="w-full flex items-center justify-center space-x-2 border-2 hover:bg-muted/50 transition-colors"
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
        </>
      )}
    </Button>
  );
};
