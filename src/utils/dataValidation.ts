
/**
 * Data validation utilities - now using consolidated modules with context awareness
 */

import { validateForAutoSave, validateForSubmission } from './validation/formValidation';
import { 
  validateProfileData as _validateProfileData,
  validateDeviceData as _validateDeviceData,
  validateTechFluencyData as _validateTechFluencyData,
  validateSkillsData as _validateSkillsData,
  validateSocialPresenceData as _validateSocialPresenceData
} from './validation/profileValidation';

export type { ValidationResult } from './validation';

// Context-aware validation functions
export const validateProfileData = (data: any, isAutoSave: boolean = false) => {
  return _validateProfileData(data, isAutoSave);
};

export const validateDeviceData = (data: any, isAutoSave: boolean = false) => {
  return _validateDeviceData(data, isAutoSave);
};

export const validateTechFluencyData = (data: any, isAutoSave: boolean = false) => {
  return _validateTechFluencyData(data, isAutoSave);
};

export const validateSkillsData = (data: any, isAutoSave: boolean = false) => {
  return _validateSkillsData(data, isAutoSave);
};

export const validateSocialPresenceData = (data: any, isAutoSave: boolean = false) => {
  return _validateSocialPresenceData(data, isAutoSave);
};

// Export form validation functions
export { validateForAutoSave, validateForSubmission };
