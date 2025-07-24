
/**
 * Throttle utility with performance monitoring
 */

import { monitoring } from '../monitoring';

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
