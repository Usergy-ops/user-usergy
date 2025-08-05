
/**
 * Validates profile update data before database operations
 */

import { 
  validateProfileData, 
  validateDeviceData, 
  validateTechFluencyData, 
  validateSkillsData, 
  validateSocialPresenceData 
} from '@/utils/dataValidation';
import type { ValidationResult } from './types';

export class ProfileDataValidator {
  validateSectionData(section: string, data: any): ValidationResult {
    switch (section) {
      case 'profile':
        return validateProfileData(data);
      case 'devices':
        return validateDeviceData(data);
      case 'tech_fluency':
        return validateTechFluencyData(data);
      case 'skills':
        return validateSkillsData(data);
      case 'social_presence':
        return validateSocialPresenceData(data);
      default:
        return { isValid: true, errors: [] };
    }
  }

  formatErrorMessage(validationResult: ValidationResult): string {
    if (Array.isArray(validationResult.errors)) {
      return validationResult.errors.join(', ');
    }
    return Object.values(validationResult.errors).join(', ');
  }
}

export const profileDataValidator = new ProfileDataValidator();
