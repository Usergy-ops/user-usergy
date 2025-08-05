
/**
 * Master export file for the entire application
 * This provides a single entry point for all modules
 */

// Utilities
export * from './utils/exports';

// Services  
export * from './services/exports';

// Hooks
export * from './hooks/exports';

// Components (optimized)
export * from './components/exports';

// Contexts
export { AuthProvider, useAuth } from './contexts/AuthContext';
export { ProfileProvider, useProfile } from './contexts/ProfileContext';

// Types from integrations
export type { Database } from './integrations/supabase/types';

// Main app components (re-export most commonly used)
export { default as App } from './App';
