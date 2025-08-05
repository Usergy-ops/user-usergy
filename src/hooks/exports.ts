
/**
 * Centralized exports for all custom hooks
 * This file consolidates all hook exports to prevent missing import issues
 */

// Optimized hooks
export { useOptimizedProfile } from './useOptimizedProfile';
export { useOptimizedErrorHandler } from './useOptimizedErrorHandler';

// Context hooks
export { useAuth } from '../contexts/AuthContext';
export { useProfile } from '../contexts/ProfileContext';

// Utility hooks
export { useAsyncOperation } from './useAsyncOperation';
export { useErrorHandler } from './useErrorHandler';
export { useProjects } from './useProjects';
export { useProject } from './useProject';

// Toast hook
export { useToast, toast } from './use-toast';

// Mobile detection hook
export { useMobile } from './use-mobile';
