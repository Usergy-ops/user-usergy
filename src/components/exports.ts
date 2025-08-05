/**
 * Centralized exports for all components - Updated with OAuth components
 */

// Authentication components
export { GoogleAuth } from './GoogleAuth';
export { OAuthButton } from './auth/OAuthButton';
export { OAuthCallback } from './auth/OAuthCallback';

// Lazy-loaded profile components
export {
  LazyBasicProfileSection,
  LazyDevicesSection,
  LazyTechFluencySection,
  LazySkillsSection,
  LazySocialPresenceSection,
  LazyEducationWorkSection,
  preloadNextComponent
} from './optimized/LazyProfileComponents';

// Optimized profile section
export { OptimizedProfileSection } from './optimized/OptimizedProfileSection';

// Integration testing components (Phase 5)
export { IntegrationTestDashboard } from './integration/IntegrationTestDashboard';
