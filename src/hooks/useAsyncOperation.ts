
import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { monitoring } from '@/utils/monitoring';

interface AsyncOperationState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  isError: boolean;
}

interface AsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export const useAsyncOperation = <T = any>(
  operation: () => Promise<T>,
  options: AsyncOperationOptions = {}
) => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false
  });

  const { handleError } = useErrorHandler();
  const { onSuccess, onError, timeout = 30000, retries = 3, retryDelay = 1000 } = options;

  const execute = useCallback(async () => {
    setState({
      data: null,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false
    });

    const operationName = operation.name || 'anonymous_operation';
    monitoring.startTiming(operationName);

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < retries) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out')), timeout);
        });

        // Race between operation and timeout
        const result = await Promise.race([operation(), timeoutPromise]);

        monitoring.endTiming(operationName);
        monitoring.recordMetric('async_operation_success', 1, {
          operation: operationName,
          attempts: (attempt + 1).toString()
        });

        setState({
          data: result,
          isLoading: false,
          error: null,
          isSuccess: true,
          isError: false
        });

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        monitoring.recordMetric('async_operation_attempt', 1, {
          operation: operationName,
          attempt: attempt.toString(),
          error: lastError.message
        });

        if (attempt < retries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    // All retries failed
    monitoring.endTiming(operationName);
    monitoring.recordMetric('async_operation_failure', 1, {
      operation: operationName,
      total_attempts: retries.toString(),
      final_error: lastError?.message || 'Unknown error'
    });

    setState({
      data: null,
      isLoading: false,
      error: lastError,
      isSuccess: false,
      isError: true
    });

    if (onError) {
      onError(lastError!);
    } else {
      handleError(lastError!, `async_operation_${operationName}`);
    }

    throw lastError;
  }, [operation, onSuccess, onError, timeout, retries, retryDelay, handleError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

// Hook for handling multiple async operations
export const useAsyncOperations = () => {
  const [operations, setOperations] = useState<Map<string, AsyncOperationState<any>>>(new Map());

  const addOperation = useCallback(<T>(
    key: string,
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ) => {
    const { execute, ...state } = useAsyncOperation(operation, options);
    
    setOperations(prev => new Map(prev.set(key, state)));
    
    return execute;
  }, []);

  const getOperation = useCallback((key: string) => {
    return operations.get(key) || {
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false
    };
  }, [operations]);

  const removeOperation = useCallback((key: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const clearOperations = useCallback(() => {
    setOperations(new Map());
  }, []);

  return {
    addOperation,
    getOperation,
    removeOperation,
    clearOperations,
    operations: Array.from(operations.entries())
  };
};
