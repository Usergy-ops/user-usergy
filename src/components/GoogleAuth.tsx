import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2, Shield, RefreshCw } from 'lucide-react';
import { monitoring, trackUserAction } from '@/utils/monitoring';
import { OAuthAuthService } from '@/services/oauthAuthService';

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
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const handleGoogleAuth = async (isRetry = false) => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    
    try {
      monitoring.startTiming(`google_auth_${mode}_${isRetry ? 'retry' : 'initial'}`);
      
      console.log('Starting Google OAuth with enhanced service:', { 
        mode, 
        isRetry,
        retryCount
      });
      
      // Use the new OAuth service
      const result = await OAuthAuthService.initiateGoogleAuth(mode);

      if (result.error) {
        console.error('Google auth error:', result.error);
        
        const errorMessage = result.error;
        
        toast({
          title: "Authentication Error",
          description: errorMessage,
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
          onError(errorMessage);
        }
        return;
      }

      monitoring.endTiming(`google_auth_${mode}_${isRetry ? 'retry' : 'initial'}`);
      
      trackUserAction(`google_auth_${mode}_initiated`, {
        provider: 'google',
        mode,
        success: true,
        oauth_signup: mode === 'signup',
        is_retry: isRetry,
        retry_count: isRetry ? retryCount + 1 : 1
      });
      
      console.log('Google OAuth initiated successfully');
      
      // Show appropriate success message
      const successMessage = getSuccessMessage(mode, isRetry);
      toast({
        title: successMessage.title,
        description: successMessage.description,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      monitoring.logError(error as Error, `google_auth_${mode}_error`, {
        mode,
        disabled,
        is_retry: isRetry,
        retry_count: retryCount
      });
      
      const errorMessage = error instanceof Error ? error.message : `An unexpected error occurred during ${mode}`;
      console.error('Google auth unexpected error:', error);
      
      toast({
        title: "Authentication Error",
        description: "Unable to connect to Google. Please check your internet connection and try again.",
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
    
    // Add exponential backoff for retries
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 5000);
    
    setTimeout(() => {
      handleGoogleAuth(true);
    }, delay);
  };

  const getErrorMessage = (errorMsg: string, isRetry: boolean): string => {
    const baseMsg = errorMsg.toLowerCase();
    
    if (baseMsg.includes('popup')) {
      return 'Popup was blocked. Please allow popups for this site and try again.';
    } else if (baseMsg.includes('network') || baseMsg.includes('fetch') || baseMsg.includes('connection')) {
      return isRetry 
        ? 'Network issue persists. Please check your internet connection and try again later.' 
        : 'Network error. Please check your connection and try again.';
    } else if (baseMsg.includes('cancelled') || baseMsg.includes('closed') || baseMsg.includes('abort')) {
      return 'Authentication was cancelled. Please try again to complete the sign-in process.';
    } else if (baseMsg.includes('redirect') || baseMsg.includes('callback')) {
      return 'OAuth redirect issue. This might be temporary - please try again.';
    } else if (baseMsg.includes('invalid_request') || baseMsg.includes('invalid_client')) {
      return 'OAuth configuration issue. Please contact support if this persists.';
    } else if (baseMsg.includes('unauthorized') || baseMsg.includes('access_denied')) {
      return 'Google authorization was denied. Please allow access to continue.';
    } else if (baseMsg.includes('timeout')) {
      return 'Request timed out. Please try again with a stable internet connection.';
    }
    
    return isRetry 
      ? `Authentication failed again. Please contact support if this continues.` 
      : `Failed to ${mode} with Google. Please try again.`;
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
    // Don't show retry for certain error types or after max retries
    if (currentRetryCount >= 3) return false;
    
    const baseMsg = errorMsg.toLowerCase();
    const nonRetryableErrors = ['invalid_client', 'invalid_request', 'access_denied'];
    
    return !nonRetryableErrors.some(err => baseMsg.includes(err));
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => handleGoogleAuth(false)}
      disabled={isLoading || disabled}
      className="w-full flex items-center justify-center space-x-2 border-2 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
