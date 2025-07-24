
/**
 * Updated error handler hook that uses the unified error handling system
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { unifiedErrorHandler } from '@/utils/unifiedErrorHandling';
import { useAuth } from '@/contexts/AuthContext';

export const useErrorHandler = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleError = useCallback(async (error: any, context?: string, metadata?: Record<string, any>) => {
    try {
      const unifiedError = await unifiedErrorHandler.handleError(
        error,
        context || 'unknown_context',
        user?.id,
        metadata
      );
      
      return unifiedError;
    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
      
      // Fallback error handling
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, user?.id]);

  const handleErrorWithRecovery = useCallback(async (
    error: any,
    context?: string,
    metadata?: Record<string, any>,
    recoveryCallback?: () => void
  ) => {
    const unifiedError = await handleError(error, context, metadata);
    
    if (unifiedError?.recoverable && recoveryCallback) {
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
