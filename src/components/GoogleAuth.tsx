
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Chrome, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleAuthProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  disabled?: boolean;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({ 
  mode = 'signin', 
  onSuccess,
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const sourceUrl = window.location.href;
      const accountType = sourceUrl.includes('user.usergy.ai') ? 'user' : 'client';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          // Pass account type through metadata
          scopes: 'email profile'
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        toast({
          title: "Authentication Error",
          description: error.message || `Failed to ${mode} with Google`,
          variant: "destructive"
        });
        return;
      }

      // Store account type for post-OAuth processing
      localStorage.setItem('pending_account_type', accountType);
      localStorage.setItem('pending_source_url', sourceUrl);

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
      className="w-full flex items-center justify-center space-x-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Chrome className="w-4 h-4" />
          <span>
            {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
          </span>
        </>
      )}
    </Button>
  );
};
