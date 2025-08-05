
/**
 * Centralized exports for optimized components
 * This file consolidates component exports to prevent missing import issues
 */

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
