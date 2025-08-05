
/**
 * Unified error handling system - legacy compatibility layer
 * This module provides backward compatibility while using the new refactored error handling system
 */

export {
  unifiedErrorHandler,
  handleError,
  handleAuthError,
  handleValidationError,
  handleNetworkError,
  handleDatabaseError,
  cleanupOldErrors,
  getErrorStatistics
} from './errorHandling';

export type {
  UnifiedError,
  ErrorContext,
  ErrorStatistics
} from './errorHandling/types';

// Legacy interface export for backward compatibility
export interface { ErrorContext };
