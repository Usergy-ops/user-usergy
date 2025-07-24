
/**
 * Resource pool for managing expensive operations
 */

import { monitoring } from '../monitoring';

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
