
/**
 * Memoization utilities with TTL and monitoring
 */

import { monitoring } from '../monitoring';

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
