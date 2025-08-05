
/**
 * Unified error handling system - main entry point
 */

import { UnifiedErrorHandler } from './errorHandler';

// Export singleton instance and convenience functions
export const unifiedErrorHandler = UnifiedErrorHandler.getInstance();

// Convenience functions
export const handleError = unifiedErrorHandler.handleError.bind(unifiedErrorHandler);
export const handleAuthError = unifiedErrorHandler.handleAuthError.bind(unifiedErrorHandler);
export const handleValidationError = unifiedErrorHandler.handleValidationError.bind(unifiedErrorHandler);
export const handleNetworkError = unifiedErrorHandler.handleNetworkError.bind(unifiedErrorHandler);
export const handleDatabaseError = unifiedErrorHandler.handleDatabaseError.bind(unifiedErrorHandler);
export const cleanupOldErrors = unifiedErrorHandler.cleanupOldErrors.bind(unifiedErrorHandler);
export const getErrorStatistics = unifiedErrorHandler.getErrorStatistics.bind(unifiedErrorHandler);

// Export types
export type { UnifiedError, ErrorContext, ErrorStatistics } from './types';
