
/**
 * Centralized exports for utilities and services
 * This file consolidates all exports to prevent missing import issues
 */

// Performance utilities
export { debounce } from './performance/debounce';
export { throttle } from './performance/throttle';
export { memoizeWithTTL } from './performance/memoization';
export { createResourcePool } from './performance/resourcePool';
export { 
  withPerformanceMonitoring, 
  createLazyLoader, 
  createBatchProcessor, 
  createCleanupManager 
} from './performance/advanced';
export { 
  executeBatchQueries, 
  optimizedProfileQueries, 
  queryCache, 
  cachedQuery 
} from './performance/queryOptimization';

// Error handling
export { 
  unifiedErrorHandler,
  handleError,
  handleAuthError,
  handleValidationError,
  handleNetworkError,
  handleDatabaseError,
  cleanupOldErrors,
  getErrorStatistics
} from './errorHandling/index';
export { errorCleanupManager } from './errorHandling/errorCleanup';
export type { UnifiedError, ErrorContext, ErrorStatistics } from './errorHandling/types';

// Legacy error handling (for backward compatibility)
export {
  handleSupabaseError,
  logError,
  withRetry,
  handleComponentError,
  setupGlobalErrorHandler,
  getUserFriendlyMessage
} from './errorHandling';
export type { ApiError } from './errorHandling';
export { ValidationError, DatabaseError, AuthError, RateLimitError, NetworkError } from './errorHandling';

// Monitoring
export { monitoring, trackUserAction } from './monitoring';

// Rate limiting
export { checkRateLimit } from './rateLimit';

// Data validation
export {
  validateProfileData,
  validateDeviceData,
  validateTechFluencyData,
  validateSkillsData,
  validateSocialPresenceData
} from './dataValidation';

// Profile utilities
export { calculateProfileCompletionPercentage } from './profileCompletionUtils';

// Security utilities  
export { generateSecureToken, hashData, validateSecureData } from './security';

// Social presence utilities
export { 
  consolidateSocialPresenceData,
  validateSocialPresenceData as validateSocialData,
  formatSocialPresenceForStorage,
  extractSocialPresenceFromProfile
} from './consolidatedSocialPresence';
