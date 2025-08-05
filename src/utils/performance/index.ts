
/**
 * Performance optimization utilities - consolidated exports
 */

export { debounce } from './debounce';
export { throttle } from './throttle';
export { memoizeWithTTL } from './memoization';
export { createResourcePool } from './resourcePool';
export { withPerformanceMonitoring, createLazyLoader, createBatchProcessor, createCleanupManager } from './advanced';
export { executeBatchQueries, optimizedProfileQueries, queryCache, cachedQuery } from './queryOptimization';
