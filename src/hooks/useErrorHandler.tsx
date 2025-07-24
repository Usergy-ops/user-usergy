
/**
 * Updated error handler hook that uses the unified error handling system
 */

import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { unifiedErrorHandler } from '@/utils/unifiedErrorHandling';

export const useErrorHandler = () => {
  const { toast } = useToast();
  const errorCount = useRef(0);
  const lastErrorTime = useRef(0);

  const handleError = useCallback(async (error: any, context?: string, metadata?: Record<string, any>) => {
    const now = Date.now();
    
    // Reset error count if it's been more than 10 seconds since last error
    if (now - lastErrorTime.current > 10000) {
      errorCount.current = 0;
    }
    
    // Increment error count and update last error time
    errorCount.current++;
    lastErrorTime.current = now;
    
    // If we've had more than 3 errors in 10 seconds, don't show more toasts
    if (errorCount.current > 3) {
      console.warn('Too many errors, suppressing toast notifications');
      return;
    }

    try {
      const unifiedError = await unifiedErrorHandler.handleError(
        error,
        context || 'unknown_context',
        undefined, // Don't try to get user ID to avoid circular dependency
        metadata
      );
      
      // Only show toast for serious errors, not validation errors during auto-save
      if (context && !context.includes('auto-save') && !context.includes('validation')) {
        toast({
          title: "Error",
          description: unifiedError?.message || "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      }
      
      return unifiedError;
    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
      
      // Only show fallback toast if we haven't exceeded the limit
      if (errorCount.current <= 3) {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const handleErrorWithRecovery = useCallback(async (
    error: any,
    context?: string,
    metadata?: Record<string, any>,
    recoveryCallback?: () => void
  ) => {
    const unifiedError = await handleError(error, context, metadata);
    
    // Only show recovery if we haven't exceeded error limit
    if (errorCount.current <= 3 && unifiedError?.recoverable && recoveryCallback) {
      // Show recovery option after a delay
      setTimeout(() => {
        toast({
          title: "Recovery Option",
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
      }, 2000);
    }
    
    return unifiedError;
  }, [handleError, toast]);

  return { handleError, handleErrorWithRecovery };
};
