
/**
 * Consolidated validation utilities - now with unified validation system
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
  validateForSubmission,
  validateForRealTime
} from './formValidation';

export {
  validateUnified,
  shouldAllowAutoSave,
  isReadyForSubmission
} from './unifiedValidation';

export type { ValidationResult, ValidationRule, ValidationSchema } from './types';
