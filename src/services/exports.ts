
/**
 * Centralized exports for all services
 * This file consolidates all service exports to prevent missing import issues
 */

// Authentication service
export { AuthService } from './authService';
export type { AuthResult } from './authService';

// Profile services
export { profileDataLoader } from './profileDataLoader';
export { profileDataUpdater } from './profileUpdater';
export { profilePictureUploader } from './profilePictureUploader';
export { profileCompletionTracker } from './profileCompletionTracker';

// Profile updater components
export { profileSectionUpdater } from './profileUpdater/profileSectionUpdater';
export { techFluencyUpdater } from './profileUpdater/techFluencyUpdater';
export { skillsUpdater } from './profileUpdater/skillsUpdater';
export { profileDataValidator } from './profileUpdater/dataValidator';
export type { SectionUpdateData, ValidationResult } from './profileUpdater/types';

// Optimized services
export {
  cachedProfileDataLoader,
  batchedProfileUpdater,
  optimizedCompletionCalculator,
  optimizedProfilePictureUpload,
  preloadProfileDependencies
} from './optimizedProfileServices';
