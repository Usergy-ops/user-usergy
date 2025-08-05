
/**
 * Profile data validation service
 */

import { validateEmail } from '@/utils/security';
import type { ValidationResult } from './types';

export class ProfileDataValidator {
  validateSectionData(section: string, data: any): ValidationResult {
    switch (section) {
      case 'profile':
        return this.validateProfileData(data);
      case 'devices':
        return this.validateDevicesData(data);
      case 'tech_fluency':
        return this.validateTechFluencyData(data);
      case 'skills':
        return this.validateSkillsData(data);
      case 'social_presence':
        return this.validateSocialPresenceData(data);
      default:
        return { isValid: false, errors: [`Unknown section: ${section}`] };
    }
  }

  private validateProfileData(data: any): ValidationResult {
    const errors: string[] = [];

    if (data.email && !validateEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.full_name && (typeof data.full_name !== 'string' || data.full_name.trim().length === 0)) {
      errors.push('Full name must be a non-empty string');
    }

    if (data.age && (typeof data.age !== 'number' || data.age < 13 || data.age > 120)) {
      errors.push('Age must be a number between 13 and 120');
    }

    if (data.phone_number && typeof data.phone_number !== 'string') {
      errors.push('Phone number must be a string');
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateDevicesData(data: any): ValidationResult {
    const errors: string[] = [];

    const arrayFields = [
      'devices_owned',
      'operating_systems', 
      'mobile_manufacturers',
      'desktop_manufacturers',
      'email_clients',
      'streaming_subscriptions',
      'music_subscriptions'
    ];

    arrayFields.forEach(field => {
      if (data[field] && !Array.isArray(data[field])) {
        errors.push(`${field} must be an array`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  private validateTechFluencyData(data: any): ValidationResult {
    const errors: string[] = [];

    if (data.coding_experience_years && (
      typeof data.coding_experience_years !== 'number' || 
      data.coding_experience_years < 0 || 
      data.coding_experience_years > 50
    )) {
      errors.push('Coding experience years must be a number between 0 and 50');
    }

    const arrayFields = ['programming_languages', 'ai_interests', 'ai_models_used'];
    
    arrayFields.forEach(field => {
      if (data[field] && !Array.isArray(data[field])) {
        errors.push(`${field} must be an array`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  private validateSkillsData(data: any): ValidationResult {
    const errors: string[] = [];

    if (data.skills && typeof data.skills !== 'object') {
      errors.push('Skills must be an object');
    }

    const arrayFields = ['interests', 'product_categories'];
    
    arrayFields.forEach(field => {
      if (data[field] && !Array.isArray(data[field])) {
        errors.push(`${field} must be an array`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  private validateSocialPresenceData(data: any): ValidationResult {
    const errors: string[] = [];

    const urlFields = ['linkedin_url', 'twitter_url', 'github_url', 'portfolio_url'];
    
    urlFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        try {
          new URL(data[field]);
        } catch {
          errors.push(`${field} must be a valid URL`);
        }
      }
    });

    if (data.additional_links && !Array.isArray(data.additional_links)) {
      errors.push('Additional links must be an array');
    }

    if (data.other_social_networks && typeof data.other_social_networks !== 'object') {
      errors.push('Other social networks must be an object');
    }

    return { isValid: errors.length === 0, errors };
  }

  formatErrorMessage(validationResult: ValidationResult): string {
    if (validationResult.isValid) {
      return '';
    }
    
    return `Validation failed: ${validationResult.errors.join(', ')}`;
  }
}

export const profileDataValidator = new ProfileDataValidator();
