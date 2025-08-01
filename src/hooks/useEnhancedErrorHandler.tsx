
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage } from '@/utils/validation/authValidation';

interface EnhancedError extends Error {
  context?: string;
  recoverable?: boolean;
  metadata?: Record<string, any>;
}

interface UseEnhancedErrorHandlerOptions {
  defaultErrorMessage?: string;
  logErrors?: boolean;
  showToast?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, context?: string) => void;
  customErrorProcessor?: (error: Error, context?: string) => string;
}

export const useEnhancedErrorHandler = (options: UseEnhancedErrorHandlerOptions = {}) => {
  const {
    defaultErrorMessage = 'An unexpected error occurred',
    logErrors = true,
    showToast = true,
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    customErrorProcessor
  } = options;

  const [currentError, setCurrentError] = useState<EnhancedError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryActionRef = useRef<(() => Promise<void>) | null>(null);
  
  const { toast } = useToast();

  const processError = useCallback((
    error: Error | string, 
    context?: string
  ): string => {
    if (customErrorProcessor && error instanceof Error) {
      return customErrorProcessor(error, context);
    }
    
    const errorMessage = error instanceof Error ? error.message : error;
    return getAuthErrorMessage(errorMessage, context);
  }, [customErrorProcessor]);

  const logError = useCallback((error: Error, context?: string, metadata?: Record<string, any>) => {
    if (!logErrors) return;
    
    console.group(`🚨 Enhanced Error Handler: ${context || 'Unknown Context'}`);
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Metadata:', metadata);
    console.log('Stack:', error.stack);
    console.log('Retry Count:', retryCount);
    console.groupEnd();
  }, [logErrors, retryCount]);

  const handleError = useCallback(async (
    error: Error | string,
    context?: string,
    metadata?: Record<string, any>,
    retryAction?: () => Promise<void>
  ) => {
    const errorObj: EnhancedError = error instanceof Error 
      ? error 
      : new Error(error);
    
    errorObj.context = context;
    errorObj.metadata = metadata;
    
    setCurrentError(errorObj);
    
    // Store retry action for later use
    if (retryAction) {
      retryActionRef.current = retryAction;
    }
    
    // Log error
    logError(errorObj, context, metadata);
    
    // Process error message
    const userMessage = processError(errorObj, context);
    
    // Show toast if enabled
    if (showToast) {
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
  }, [processError, logError, showToast, toast, onError]);

  const retry = useCallback(async () => {
    const action = retryActionRef.current;
    if (!action || retryCount >= maxRetries || isRetrying) {
      return;
    }
    
    setIsRetrying(true);
    
    try {
      // Wait before retry
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      await action();
      
      // Success - reset error state
      setCurrentError(null);
      setRetryCount(0);
      retryActionRef.current = null;
      
      if (showToast) {
        toast({
          title: "Success",
          description: "Operation completed successfully."
        });
      }
    } catch (retryError) {
      setRetryCount(prev => prev + 1);
      
      const newRetryCount = retryCount + 1;
      if (newRetryCount >= maxRetries) {
        await handleError(
          retryError as Error, 
          currentError?.context, 
          { 
            ...currentError?.metadata, 
            finalRetry: true,
            totalRetries: newRetryCount 
          }
        );
        
        if (showToast) {
          toast({
            title: "Maximum retries reached",
            description: "Please refresh the page and try again.",
            variant: "destructive"
          });
        }
      } else {
        await handleError(retryError as Error, currentError?.context);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [
    retryCount, 
    maxRetries, 
    isRetrying, 
    retryDelay, 
    handleError, 
    currentError, 
    showToast, 
    toast
  ]);

  const clearError = useCallback(() => {
    setCurrentError(null);
    setRetryCount(0);
    retryActionRef.current = null;
  }, []);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string,
    metadata?: Record<string, any>
  ): Promise<T | null> => {
    try {
      const result = await operation();
      clearError(); // Clear any previous errors on success
      return result;
    } catch (error) {
      await handleError(error as Error, context, metadata, operation);
      return null;
    }
  }, [handleError, clearError]);

  const wrapAsyncFunction = useCallback(<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    context: string
  ) => {
    return async (...args: TArgs): Promise<TReturn | null> => {
      return handleAsyncOperation(
        () => fn(...args),
        context,
        { functionName: fn.name, arguments: args }
      );
    };
  }, [handleAsyncOperation]);

  return {
    handleError,
    handleAsyncOperation,
    wrapAsyncFunction,
    clearError,
    retry,
    currentError,
    isRetrying,
    retryCount,
    canRetry: retryCount < maxRetries && !isRetrying && !!retryActionRef.current,
    processError,
    logError
  };
};
