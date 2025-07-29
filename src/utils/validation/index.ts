
/**
 * Consolidated validation utilities
 */

export { 
  validateInput, 
  sanitizeUserInput, 
  sanitizeForDatabase,
  useRealTimeValidation,
  createContextualValidator,
  VALIDATION_SCHEMAS
} from './inputValidation';

export {
  validateProfileData,
  validateDeviceData,
  validateTechFluencyData,
  validateSkillsData,
  validateSocialPresenceData
} from './profileValidation';

export {
  validateForAutoSave,
  validateForSubmission
} from './formValidation';

export type { ValidationResult, ValidationRule, ValidationSchema } from './types';
