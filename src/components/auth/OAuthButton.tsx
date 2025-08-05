
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2, Shield, RefreshCw } from 'lucide-react';
import { monitoring, trackUserAction } from '@/utils/monitoring';
import { OAuthAuthService } from '@/services/oauthAuthService';

interface OAuthButtonProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({ 
  mode, 
  onSuccess, 
  onError,
  disabled = false,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const handleOAuthFlow = async (isRetry = false) => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    
    try {
      monitoring.startTiming(`oauth_${mode}_${isRetry ? 'retry' : 'initial'}`);
      
      console.log('Starting OAuth flow:', { 
        mode, 
        isRetry,
        retryCount
      });
      
      const result = await OAuthAuthService.initiateGoogleAuth(mode);

      if (result.error) {
        console.error('OAuth error:', result.error);
        
        toast({
          title: "Authentication Error",
          description: result.error,
          variant: "destructive",
          action: shouldShowRetry(result.error, retryCount) ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleRetry()}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          ) : undefined
        });
        
        if (onError) {
          onError(result.error);
        }
        return;
      }

      monitoring.endTiming(`oauth_${mode}_${isRetry ? 'retry' : 'initial'}`);
      
      trackUserAction(`oauth_${mode}_initiated`, {
        provider: 'google',
        mode,
        success: true,
        is_retry: isRetry,
        retry_count: isRetry ? retryCount + 1 : 1
      });
      
      const successMessage = getSuccessMessage(mode, isRetry);
      toast({
        title: successMessage.title,
        description: successMessage.description,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      monitoring.logError(error as Error, `oauth_${mode}_error`, {
        mode,
        disabled,
        is_retry: isRetry,
        retry_count: retryCount
      });
      
      const errorMessage = "Unable to connect to Google. Please check your internet connection and try again.";
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
        action: retryCount < 2 ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRetry()}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        ) : undefined
      });
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 5000);
    
    setTimeout(() => {
      handleOAuthFlow(true);
    }, delay);
  };

  const getSuccessMessage = (mode: string, isRetry: boolean) => {
    if (mode === 'signup') {
      return {
        title: isRetry ? "Account Creation Resumed!" : "Account Creation Started!",
        description: "Redirecting to Google for secure signup. You'll complete your profile after authentication."
      };
    } else {
      return {
        title: isRetry ? "Sign In Resumed!" : "Welcome Back!",
        description: "Redirecting to Google for authentication..."
      };
    }
  };

  const shouldShowRetry = (errorMsg: string, currentRetryCount: number): boolean => {
    if (currentRetryCount >= 3) return false;
    
    const baseMsg = errorMsg.toLowerCase();
    const nonRetryableErrors = ['invalid_client', 'invalid_request', 'access_denied'];
    
    return !nonRetryableErrors.some(err => baseMsg.includes(err));
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => handleOAuthFlow(false)}
      disabled={isLoading || disabled}
      className={`w-full flex items-center justify-center space-x-2 border-2 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{retryCount > 0 ? 'Retrying...' : 'Connecting to Google...'}</span>
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
