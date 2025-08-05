
/**
 * Simple performance utility functions
 */

// Simple throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(null, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(null, args);
      }, remaining);
    }
  };
};

// Simple debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(null, args);
    }, wait);
  };
};

// Re-export advanced performance utilities
export { memoizeWithTTL } from './performance/memoization';
export { createResourcePool } from './performance/resourcePool';
export { withPerformanceMonitoring, createLazyLoader, createBatchProcessor, createCleanupManager } from './performance/advanced';
export { executeBatchQueries, optimizedProfileQueries, queryCache, cachedQuery } from './performance/queryOptimization';
