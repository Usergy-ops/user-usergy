
/**
 * Performance optimization utilities - now using consolidated modules
 * @deprecated Use individual modules from src/utils/performance/ instead
 */

export { 
  debounce, 
  throttle, 
  memoizeWithTTL, 
  createResourcePool,
  withPerformanceMonitoring,
  createLazyLoader,
  createBatchProcessor,
  createCleanupManager
} from './performance';
