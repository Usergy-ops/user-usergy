
/**
 * Unified validation system - resolves conflicts between different validation layers
 */

import { ValidationResult } from './types';

interface ValidationContext {
  isAutoSave: boolean;
  isSubmission: boolean;
  isRealTime: boolean;
  section: string;
}

export const validateUnified = (data: any, context: ValidationContext): ValidationResult => {
  const errors: string[] = [];
  const sanitizedData: Record<string, any> = { ...data };

  switch (context.section) {
    case 'profile':
      return validateProfileUnified(data, context);
    case 'devices':
      return validateDevicesUnified(data, context);
    case 'tech_fluency':
      return validateTechFluencyUnified(data, context);
    case 'skills':
      return validateSkillsUnified(data, context);
    case 'social_presence':
      return validateSocialPresenceUnified(data, context);
    default:
      return { isValid: true, errors: [], sanitizedData };
  }
};

const validateProfileUnified = (data: any, context: ValidationContext): ValidationResult => {
  const errors: string[] = [];
  const sanitizedData: Record<string, any> = { ...data };

  // For auto-save and real-time, only validate format - no required field validation
  if (context.isAutoSave || context.isRealTime) {
    if (data.full_name && typeof data.full_name === 'string' && data.full_name.trim() !== '') {
      if (data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
        errors.push('Full name must be between 2 and 100 characters');
      }
    }
    
    if (data.email && typeof data.email === 'string' && data.email.trim() !== '') {
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
        errors.push('Invalid email format');
      }
    }

    if (data.age && (typeof data.age !== 'number' || data.age < 13 || data.age > 120)) {
      errors.push('Age must be between 13 and 120');
    }
  }

  // For submission, validate required fields
  if (context.isSubmission) {
    if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim() === '') {
      errors.push('Full name is required');
    }
    
    if (!data.age || typeof data.age !== 'number' || data.age <= 0) {
      errors.push('Age is required');
    }

    if (!data.gender || typeof data.gender !== 'string' || data.gender.trim() === '') {
      errors.push('Gender is required');
    }

    if (!data.country || typeof data.country !== 'string' || data.country.trim() === '') {
      errors.push('Country is required');
    }

    if (!data.city || typeof data.city !== 'string' || data.city.trim() === '') {
      errors.push('City is required');
    }

    if (!data.timezone || typeof data.timezone !== 'string' || data.timezone.trim() === '') {
      errors.push('Timezone is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

const validateDevicesUnified = (data: any, context: ValidationContext): ValidationResult => {
  const errors: string[] = [];
  const sanitizedData: Record<string, any> = { ...data };

  // Validate array fields if they exist
  const arrayFields = ['operating_systems', 'devices_owned', 'mobile_manufacturers', 'email_clients'];
  
  arrayFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      if (!Array.isArray(data[field])) {
        errors.push(`${field.replace('_', ' ')} must be an array`);
      } else if (context.isSubmission && data[field].length === 0) {
        // Only require non-empty arrays during submission
        if (field === 'operating_systems' || field === 'devices_owned' || 
            field === 'mobile_manufacturers' || field === 'email_clients') {
          errors.push(`At least one ${field.replace('_', ' ').slice(0, -1)} is required`);
        }
      }
    } else if (context.isSubmission) {
      errors.push(`${field.replace('_', ' ')} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

const validateTechFluencyUnified = (data: any, context: ValidationContext): ValidationResult => {
  const errors: string[] = [];
  const sanitizedData: Record<string, any> = { ...data };

  // Coding experience validation
  if (data.coding_experience_years !== undefined && data.coding_experience_years !== null) {
    if (typeof data.coding_experience_years === 'number') {
      if (data.coding_experience_years < 0 || data.coding_experience_years > 50) {
        errors.push('Coding experience must be between 0 and 50 years');
      }
    }
  }

  // Array fields validation
  const arrayFields = ['ai_models_used', 'ai_interests', 'programming_languages'];
  
  arrayFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      if (!Array.isArray(data[field])) {
        errors.push(`${field.replace('_', ' ')} must be an array`);
      } else if (context.isSubmission && (field === 'ai_models_used' || field === 'ai_interests')) {
        // Only validate required fields during final submission
        if (data[field].length === 0) {
          errors.push(`At least one ${field.replace('_', ' ').slice(0, -1)} is required`);
        }
      }
    } else if (context.isSubmission && (field === 'ai_models_used' || field === 'ai_interests')) {
      errors.push(`${field.replace('_', ' ')} is required`);
    }
  });

  // Required level fields for submission
  if (context.isSubmission) {
    if (!data.technical_experience_level || typeof data.technical_experience_level !== 'string' || data.technical_experience_level.trim() === '') {
      errors.push('Technical experience level is required');
    }

    if (!data.ai_familiarity_level || typeof data.ai_familiarity_level !== 'string' || data.ai_familiarity_level.trim() === '') {
      errors.push('AI familiarity level is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

const validateSkillsUnified = (data: any, context: ValidationContext): ValidationResult => {
  const errors: string[] = [];
  const sanitizedData: Record<string, any> = { ...data };

  // Validate interests array
  if (data.interests !== undefined && data.interests !== null) {
    if (!Array.isArray(data.interests)) {
      errors.push('Interests must be an array');
    } else if (context.isSubmission && data.interests.length === 0) {
      errors.push('At least one interest is required');
    }
  } else if (context.isSubmission) {
    errors.push('Interests are required');
  }

  // Validate product categories array
  if (data.product_categories !== undefined && data.product_categories !== null) {
    if (!Array.isArray(data.product_categories)) {
      errors.push('Product categories must be an array');
    }
  }

  // Validate skills object
  if (data.skills !== undefined && data.skills !== null) {
    if (typeof data.skills !== 'object') {
      errors.push('Skills must be an object');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

const validateSocialPresenceUnified = (data: any, context: ValidationContext): ValidationResult => {
  const errors: string[] = [];
  const sanitizedData: Record<string, any> = { ...data };

  // Validate additional links array
  if (data.additional_links !== undefined && data.additional_links !== null) {
    if (!Array.isArray(data.additional_links)) {
      errors.push('Additional links must be an array');
    }
  }

  // Validate other social networks object
  if (data.other_social_networks !== undefined && data.other_social_networks !== null) {
    if (typeof data.other_social_networks !== 'object') {
      errors.push('Other social networks must be an object');
    }
  }

  // Validate URL fields if provided
  const urlFields = ['linkedin_url', 'github_url', 'twitter_url', 'portfolio_url'];
  
  urlFields.forEach(field => {
    if (data[field] && typeof data[field] === 'string' && data[field].trim() !== '') {
      try {
        new URL(data[field]);
      } catch {
        errors.push(`${field.replace('_', ' ')} must be a valid URL`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

// Helper function to determine if validation should pass for auto-save
export const shouldAllowAutoSave = (data: any, section: string): boolean => {
  // Always allow auto-save for partial data - we only validate what's provided
  return true;
};

// Helper function to check if section is ready for submission
export const isReadyForSubmission = (data: any, section: string): boolean => {
  const context: ValidationContext = {
    isAutoSave: false,
    isSubmission: true,
    isRealTime: false,
    section
  };
  
  const result = validateUnified(data, context);
  return result.isValid;
};
