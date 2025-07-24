
/**
 * Performance optimization utilities for enhanced user experience
 */

import { monitoring } from './monitoring';

// Debounce function with monitoring
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): T => {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) {
        const startTime = performance.now();
        const result = func(...args);
        const endTime = performance.now();
        
        monitoring.recordMetric('debounced_function_execution', endTime - startTime, {
          function_name: func.name || 'anonymous',
          wait_time: wait.toString()
        });
        
        return result;
      }
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      const startTime = performance.now();
      const result = func(...args);
      const endTime = performance.now();
      
      monitoring.recordMetric('debounced_function_execution', endTime - startTime, {
        function_name: func.name || 'anonymous',
        wait_time: wait.toString(),
        immediate: 'true'
      });
      
      return result;
    }
  }) as T;
};

// Throttle function with monitoring
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean = false;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      const startTime = performance.now();
      const result = func(...args);
      const endTime = performance.now();
      
      monitoring.recordMetric('throttled_function_execution', endTime - startTime, {
        function_name: func.name || 'anonymous',
        limit: limit.toString()
      });
      
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      return result;
    }
  }) as T;
};

// Memoization with TTL and monitoring
export const memoizeWithTTL = <T extends (...args: any[]) => any>(
  func: T,
  ttl: number = 300000 // 5 minutes default
): T => {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);
    
    if (cached && (now - cached.timestamp) < ttl) {
      monitoring.recordMetric('memoized_cache_hit', 1, {
        function_name: func.name || 'anonymous',
        cache_size: cache.size.toString()
      });
      return cached.value;
    }
    
    const startTime = performance.now();
    const result = func(...args);
    const endTime = performance.now();
    
    cache.set(key, { value: result, timestamp: now });
    
    monitoring.recordMetric('memoized_cache_miss', 1, {
      function_name: func.name || 'anonymous',
      execution_time: (endTime - startTime).toString(),
      cache_size: cache.size.toString()
    });
    
    // Clean up expired entries
    if (cache.size > 100) {
      for (const [cacheKey, cacheValue] of cache.entries()) {
        if (now - cacheValue.timestamp > ttl) {
          cache.delete(cacheKey);
        }
      }
    }
    
    return result;
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

// Resource pool for managing expensive operations
export const createResourcePool = <T>(
  factory: () => T,
  destroyer: (resource: T) => void,
  maxSize: number = 10
) => {
  const pool: T[] = [];
  const inUse = new Set<T>();
  
  return {
    acquire: async (): Promise<T> => {
      const startTime = performance.now();
      
      let resource: T;
      if (pool.length > 0) {
        resource = pool.pop()!;
        monitoring.recordMetric('resource_pool_reuse', 1, {
          pool_size: pool.length.toString(),
          in_use: inUse.size.toString()
        });
      } else {
        resource = factory();
        monitoring.recordMetric('resource_pool_create', performance.now() - startTime, {
          pool_size: pool.length.toString(),
          in_use: inUse.size.toString()
        });
      }
      
      inUse.add(resource);
      return resource;
    },
    
    release: (resource: T): void => {
      inUse.delete(resource);
      
      if (pool.length < maxSize) {
        pool.push(resource);
        monitoring.recordMetric('resource_pool_return', 1, {
          pool_size: pool.length.toString(),
          in_use: inUse.size.toString()
        });
      } else {
        destroyer(resource);
        monitoring.recordMetric('resource_pool_destroy', 1, {
          pool_size: pool.length.toString(),
          in_use: inUse.size.toString()
        });
      }
    },
    
    get poolSize() { return pool.length; },
    get inUseCount() { return inUse.size; }
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
