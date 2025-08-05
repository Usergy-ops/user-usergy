
import { useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { throttle } from '@/utils/performance';
import { unifiedErrorHandler } from '@/utils/unifiedErrorHandling';

/**
 * Performance-optimized error handler with throttling and smart error suppression
 */
export const useOptimizedErrorHandler = () => {
  const { toast } = useToast();
  const errorCache = useRef(new Map<string, number>());
  const lastErrorTime = useRef(0);

  // Throttled toast function to prevent spam
  const throttledToast = useMemo(
    () => throttle((message: string, type: 'error' | 'warning' = 'error') => {
      toast({
        title: type === 'error' ? 'Error' : 'Warning',
        description: message,
        variant: type === 'error' ? 'destructive' : 'default'
      });
    }, 2000),
    [toast]
  );

  const formatErrorMessage = useCallback((error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.errors) {
      if (Array.isArray(error.errors)) {
        return error.errors.join(', ');
      }
      if (typeof error.errors === 'object') {
        return Object.values(error.errors).join(', ');
      }
    }
    if (error?.message) return error.message;
    return 'An unexpected error occurred. Please try again.';
  }, []);

  const shouldSuppressError = useCallback((errorKey: string): boolean => {
    const now = Date.now();
    const lastCount = errorCache.current.get(errorKey) || 0;
    
    // Reset cache if it's been more than 30 seconds
    if (now - lastErrorTime.current > 30000) {
      errorCache.current.clear();
      lastErrorTime.current = now;
      return false;
    }
    
    // Suppress if we've seen this error more than 3 times recently
    if (lastCount >= 3) {
      return true;
    }
    
    errorCache.current.set(errorKey, lastCount + 1);
    return false;
  }, []);

  const handleError = useCallback(async (
    error: any, 
    context?: string, 
    metadata?: Record<string, any>
  ) => {
    try {
      const errorMessage = formatErrorMessage(error);
      const errorKey = `${context || 'unknown'}_${errorMessage.substring(0, 50)}`;
      
      // Check if we should suppress this error
      if (shouldSuppressError(errorKey)) {
        console.warn('Error suppressed due to frequency:', errorKey);
        return;
      }

      // Handle error through unified system
      const unifiedError = await unifiedErrorHandler.handleError(
        error,
        context || 'optimized_error_handler',
        undefined,
        metadata
      );
      
      // Only show toast for non-validation errors in user-facing contexts
      if (context && !context.includes('auto-save') && !context.includes('validation')) {
        throttledToast(errorMessage, unifiedError?.severity === 'critical' ? 'error' : 'warning');
      }
      
      return unifiedError;
    } catch (handlingError) {
      console.error('Error in optimized error handler:', handlingError);
      
      // Fallback toast
      const errorMessage = formatErrorMessage(error);
      throttledToast(errorMessage);
    }
  }, [formatErrorMessage, shouldSuppressError, throttledToast]);

  const handleErrorWithRecovery = useCallback(async (
    error: any,
    context?: string,
    metadata?: Record<string, any>,
    recoveryCallback?: () => void
  ) => {
    const unifiedError = await handleError(error, context, metadata);
    
    // Show recovery option for recoverable errors
    if (unifiedError?.recoverable && recoveryCallback) {
      setTimeout(() => {
        toast({
          title: "Recovery Available",
          description: "Click to retry the operation",
          action: (
            <button
              onClick={recoveryCallback}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring"
            >
              Retry
            </button>
          )
        });
      }, 3000);
    }
    
    return unifiedError;
  }, [handleError, toast]);

  return {
    handleError,
    handleErrorWithRecovery,
    clearErrorCache: useCallback(() => {
      errorCache.current.clear();
    }, [])
  };
};
