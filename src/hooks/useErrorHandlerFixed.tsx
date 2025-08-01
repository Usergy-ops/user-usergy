
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { monitoring } from '@/utils/monitoring';

interface ErrorWithRecovery {
  error: Error;
  context: string;
  metadata?: Record<string, any>;
  recoveryAction?: () => void | Promise<void>;
}

interface UseErrorHandlerFixedOptions {
  defaultErrorMessage?: string;
  logErrors?: boolean;
  showToast?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, context?: string) => void;
}

export const useErrorHandlerFixed = (options: UseErrorHandlerFixedOptions = {}) => {
  const {
    defaultErrorMessage = 'An unexpected error occurred',
    logErrors = true,
    showToast = true,
    retryable = false,
    maxRetries = 3,
    retryDelay = 1000,
    onError
  } = options;

  const [currentError, setCurrentError] = useState<Error | null>(null);
  const [errorContext, setErrorContext] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const { toast } = useToast();

  const getUserFriendlyMessage = useCallback((error: Error, context?: string): string => {
    const errorMessage = error.message.toLowerCase();
    
    // Authentication errors
    if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid email or password')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (errorMessage.includes('email not confirmed')) {
      return 'Please verify your email address before signing in.';
    }
    
    if (errorMessage.includes('user already registered') || errorMessage.includes('already exists')) {
      return 'This email is already registered. Please sign in instead.';
    }
    
    if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Connection failed. Please check your internet connection and try again.';
    }
    
    if (errorMessage.includes('password') && errorMessage.includes('security')) {
      return 'Password does not meet security requirements. Please use at least 12 characters with mixed case, numbers, and special characters.';
    }
    
    if (errorMessage.includes('expired') || errorMessage.includes('invalid') && context?.includes('otp')) {
      return 'Verification code is invalid or expired. Please request a new code.';
    }
    
    // OTP specific errors
    if (context?.includes('otp')) {
      if (errorMessage.includes('blocked')) {
        return 'Too many failed attempts. Please try again later.';
      }
      if (errorMessage.includes('attempts')) {
        return 'Invalid verification code. Please check your code and try again.';
      }
    }
    
    // Google OAuth errors
    if (context?.includes('google') || context?.includes('oauth')) {
      if (errorMessage.includes('popup')) {
        return 'Popup was blocked. Please allow popups for this site and try again.';
      }
      if (errorMessage.includes('cancelled')) {
        return 'Authentication was cancelled. Please try again.';
      }
      if (errorMessage.includes('redirect')) {
        return 'Authentication failed due to redirect issues. Please try again.';
      }
    }
    
    // Generic fallback
    return error.message || defaultErrorMessage;
  }, [defaultErrorMessage]);

  const handleError = useCallback(async (
    error: Error | string, 
    context?: string, 
    metadata?: Record<string, any>
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    setCurrentError(errorObj);
    setErrorContext(context || null);
    
    // Log error
    if (logErrors) {
      console.error(`Error in ${context || 'unknown context'}:`, errorObj);
      
      // Send to monitoring if available
      if (monitoring?.logError) {
        monitoring.logError(errorObj, context || 'unknown_context', metadata);
      }
    }
    
    // Show toast notification
    if (showToast) {
      const userMessage = getUserFriendlyMessage(errorObj, context);
      
      toast({
        title: "Error",
        description: userMessage,
        variant: "destructive"
      });
    }
    
    // Call custom error handler
    if (onError) {
      onError(errorObj, context);
    }
  }, [logErrors, showToast, getUserFriendlyMessage, toast, onError]);

  const handleErrorWithRecovery = useCallback(async (
    error: Error | string,
    context: string,
    metadata?: Record<string, any>,
    recoveryAction?: () => void | Promise<void>
  ) => {
    await handleError(error, context, metadata);
    
    // If recovery action is provided and retries are enabled
    if (recoveryAction && retryable && retryCount < maxRetries) {
      try {
        setIsRetrying(true);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        await recoveryAction();
        
        // Success - reset retry count
        setRetryCount(0);
        setCurrentError(null);
        setErrorContext(null);
      } catch (retryError) {
        setRetryCount(prev => prev + 1);
        
        if (retryCount + 1 >= maxRetries) {
          toast({
            title: "Maximum retries reached",
            description: "Please refresh the page and try again.",
            variant: "destructive"
          });
        }
      } finally {
        setIsRetrying(false);
      }
    }
  }, [handleError, retryable, retryCount, maxRetries, retryDelay, toast]);

  const clearError = useCallback(() => {
    setCurrentError(null);
    setErrorContext(null);
    setRetryCount(0);
  }, []);

  const retry = useCallback(async (recoveryAction?: () => void | Promise<void>) => {
    if (!currentError || !retryable) return;
    
    if (retryCount >= maxRetries) {
      toast({
        title: "Maximum retries reached",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsRetrying(true);
      
      if (recoveryAction) {
        await recoveryAction();
      }
      
      // Success - reset state
      setRetryCount(0);
      setCurrentError(null);
      setErrorContext(null);
      
      toast({
        title: "Success",
        description: "Operation completed successfully.",
      });
    } catch (retryError) {
      setRetryCount(prev => prev + 1);
      await handleError(retryError as Error, errorContext || 'retry');
    } finally {
      setIsRetrying(false);
    }
  }, [currentError, retryable, retryCount, maxRetries, toast, handleError, errorContext]);

  return {
    handleError,
    handleErrorWithRecovery,
    clearError,
    retry,
    currentError,
    errorContext,
    retryCount,
    isRetrying,
    canRetry: retryable && retryCount < maxRetries,
    getUserFriendlyMessage
  };
};
