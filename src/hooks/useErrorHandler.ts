
/**
 * Custom hook for centralized error handling
 */

import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';
import { handleSupabaseError, logError, ValidationError, DatabaseError, AuthError } from '@/utils/errorHandling';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    logError(error, context);

    if (error instanceof ValidationError) {
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    if (error instanceof AuthError) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    if (error instanceof DatabaseError) {
      toast({
        title: "Database Error",
        description: "There was an issue with the database. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Handle Supabase errors
    if (error.code || error.details) {
      const apiError = handleSupabaseError(error);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive"
      });
      return;
    }

    // Generic error fallback
    toast({
      title: "Unexpected Error",
      description: error.message || "An unexpected error occurred. Please try again.",
      variant: "destructive"
    });
  }, [toast]);

  return { handleError };
};
