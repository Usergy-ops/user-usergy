
/**
 * Data validation utilities - now using consolidated modules
 * @deprecated Use individual modules from src/utils/validation/ instead
 */

export {
  validateProfileData,
  validateDeviceData,
  validateTechFluencyData,
  validateSkillsData,
  validateSocialPresenceData
} from './validation/profileValidation';

export type { ValidationResult } from './validation';
