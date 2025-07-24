
/**
 * Advanced performance utilities
 */

import { monitoring } from '../monitoring';

// Performance monitoring decorator
export const withPerformanceMonitoring = <T extends (...args: any[]) => any>(
  func: T,
  operationName?: string
): T => {
  const name = operationName || func.name || 'anonymous_function';
  
  return ((...args: Parameters<T>) => {
    const startTime = performance.now();
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
    
    try {
      const result = func(...args);
      
      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result.then(
          (resolvedResult) => {
            const endTime = performance.now();
            const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
            
            monitoring.recordMetric('function_execution_time', endTime - startTime, {
              function_name: name,
              type: 'async',
              memory_delta: (memoryAfter - memoryBefore).toString()
            });
            
            return resolvedResult;
          },
          (error) => {
            const endTime = performance.now();
            monitoring.recordMetric('function_execution_error', endTime - startTime, {
              function_name: name,
              type: 'async',
              error_message: error.message
            });
            throw error;
          }
        );
      } else {
        const endTime = performance.now();
        const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
        
        monitoring.recordMetric('function_execution_time', endTime - startTime, {
          function_name: name,
          type: 'sync',
          memory_delta: (memoryAfter - memoryBefore).toString()
        });
        
        return result;
      }
    } catch (error) {
      const endTime = performance.now();
      monitoring.recordMetric('function_execution_error', endTime - startTime, {
        function_name: name,
        type: 'sync',
        error_message: (error as Error).message
      });
      throw error;
    }
  }) as T;
};

// Lazy loading utility
export const createLazyLoader = <T>(
  loader: () => Promise<T>,
  fallback?: T
) => {
  let loading = false;
  let loaded = false;
  let value: T | undefined = fallback;
  let error: Error | null = null;
  
  return {
    load: async (): Promise<T> => {
      if (loaded && value !== undefined) {
        return value;
      }
      
      if (loading) {
        // Wait for ongoing load
        while (loading) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        return value!;
      }
      
      loading = true;
      const startTime = performance.now();
      
      try {
        value = await loader();
        loaded = true;
        error = null;
        
        const endTime = performance.now();
        monitoring.recordMetric('lazy_load_success', endTime - startTime, {
          loader_name: loader.name || 'anonymous'
        });
        
        return value;
      } catch (err) {
        error = err as Error;
        monitoring.recordMetric('lazy_load_error', 1, {
          loader_name: loader.name || 'anonymous',
          error_message: error.message
        });
        throw error;
      } finally {
        loading = false;
      }
    },
    
    get isLoaded() { return loaded; },
    get isLoading() { return loading; },
    get value() { return value; },
    get error() { return error; }
  };
};

// Batch operations utility
export const createBatchProcessor = <T, R>(
  processor: (items: T[]) => Promise<R[]>,
  batchSize: number = 10,
  delay: number = 100
) => {
  let queue: T[] = [];
  let processing = false;
  let resolvers: Array<(value: R) => void> = [];
  
  const processBatch = async () => {
    if (processing || queue.length === 0) return;
    
    processing = true;
    const batch = queue.splice(0, batchSize);
    const currentResolvers = resolvers.splice(0, batchSize);
    
    try {
      const startTime = performance.now();
      const results = await processor(batch);
      const endTime = performance.now();
      
      monitoring.recordMetric('batch_processing_time', endTime - startTime, {
        batch_size: batch.length.toString(),
        processor_name: processor.name || 'anonymous'
      });
      
      results.forEach((result, index) => {
        currentResolvers[index]?.(result);
      });
    } catch (error) {
      monitoring.recordMetric('batch_processing_error', 1, {
        batch_size: batch.length.toString(),
        processor_name: processor.name || 'anonymous',
        error_message: (error as Error).message
      });
      throw error;
    } finally {
      processing = false;
      
      // Process next batch if queue is not empty
      if (queue.length > 0) {
        setTimeout(processBatch, delay);
      }
    }
  };
  
  return {
    add: (item: T): Promise<R> => {
      return new Promise((resolve) => {
        queue.push(item);
        resolvers.push(resolve);
        
        if (!processing) {
          setTimeout(processBatch, delay);
        }
      });
    },
    
    flush: async (): Promise<void> => {
      while (queue.length > 0 || processing) {
        await processBatch();
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    },
    
    get queueSize() { return queue.length; },
    get isProcessing() { return processing; }
  };
};

// Cleanup utility for preventing memory leaks
export const createCleanupManager = () => {
  const cleanupFunctions: Array<() => void> = [];
  
  return {
    add: (cleanup: () => void): void => {
      cleanupFunctions.push(cleanup);
    },
    
    cleanup: (): void => {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          monitoring.logError(error as Error, 'cleanup_manager', {
            cleanup_function: cleanup.name || 'anonymous'
          });
        }
      });
      cleanupFunctions.length = 0;
    },
    
    get cleanupCount() { return cleanupFunctions.length; }
  };
};
