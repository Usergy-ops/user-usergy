
/**
 * Debounce utility with performance monitoring
 */

import { monitoring } from '../monitoring';

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
