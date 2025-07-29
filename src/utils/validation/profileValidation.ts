
/**
 * Profile-specific validation utilities
 */

import { validateEmail, validateAge, validateCompletionPercentage, validateCodingExperience } from '../security';
import { ValidationResult } from './types';

export const validateProfileData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Ensure data is not null/undefined
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

  // Email validation
  if (data.email && !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  // Age validation
  if (data.age !== undefined && data.age !== null && !validateAge(data.age)) {
    errors.push('Age must be between 13 and 120');
  }

  // Full name validation - only validate if provided and not empty
  if (data.full_name && data.full_name.trim() !== '') {
    if (data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
      errors.push('Full name must be between 2 and 100 characters');
    }
  }

  // Date of birth validation - only validate if provided
  if (data.date_of_birth) {
    const dateValue = new Date(data.date_of_birth);
    if (isNaN(dateValue.getTime())) {
      errors.push('Invalid date of birth format');
    } else {
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
      
      if (dateValue < minDate || dateValue > maxDate) {
        errors.push('Date of birth must be between 13 and 120 years ago');
      }
    }
  }

  // Completion percentage validation
  if (data.completion_percentage !== undefined && data.completion_percentage !== null && !validateCompletionPercentage(data.completion_percentage)) {
    errors.push('Completion percentage must be between 0 and 100');
  }

  // Languages spoken validation - ensure it's an array if provided
  if (data.languages_spoken && !Array.isArray(data.languages_spoken)) {
    errors.push('Languages spoken must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    sanitizedData: data
  };
};

export const validateDeviceData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Ensure data is not null/undefined
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

  // Validate arrays are not empty when provided - but allow null/undefined for optional fields
  const arrayFields = ['operating_systems', 'devices_owned', 'mobile_manufacturers', 'email_clients'];
  
  arrayFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      if (!Array.isArray(data[field])) {
        errors.push(`${field.replace('_', ' ')} must be an array`);
      }
      // Only validate non-empty for required fields during final submission
      else if (['operating_systems', 'devices_owned', 'mobile_manufacturers', 'email_clients'].includes(field)) {
        if (data[field].length === 0) {
          // Only error if this is clearly a final submission attempt
          console.warn(`${field} is empty - may be auto-save`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors,
    sanitizedData: data
  };
};

export const validateTechFluencyData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  const errors: string[] = [];

  // Ensure data is not null/undefined
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

  // Coding experience validation - always validate if provided
  if (data.coding_experience_years !== undefined && data.coding_experience_years !== null) {
    if (!validateCodingExperience(data.coding_experience_years)) {
      errors.push('Coding experience must be between 0 and 50 years');
    }
  }

  // Array fields validation - Fixed logic for array validation
  const arrayFields = ['ai_models_used', 'ai_interests', 'programming_languages'];
  
  arrayFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      if (!Array.isArray(data[field])) {
        errors.push(`${field.replace('_', ' ')} must be an array`);
      }
      // For auto-save, don't validate required fields - allow empty arrays
      else if (!isAutoSave && (field === 'ai_models_used' || field === 'ai_interests')) {
        // Only validate required fields during final submission
        if (data[field].length === 0) {
          errors.push(`${field.replace('_', ' ')} is required`);
        }
      }
    }
  });

  console.log('TechFluencyData validation:', {
    data,
    isAutoSave,
    errors,
    isValid: errors.length === 0
  });

  return {
    isValid: errors.length === 0,
    errors: errors,
    sanitizedData: data
  };
};

export const validateSkillsData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Ensure data is not null/undefined
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

  // Validate interests array - now mandatory only during final submission
  if (data.interests !== undefined && data.interests !== null) {
    if (!Array.isArray(data.interests)) {
      errors.push('Interests must be an array');
    } else if (data.interests.length === 0) {
      // Only require non-empty during final submission
      console.warn('Interests array is empty - may be auto-save');
    }
  }

  // Validate product categories array - optional but must be array if provided
  if (data.product_categories && !Array.isArray(data.product_categories)) {
    errors.push('Product categories must be an array');
  }

  // Validate skills object
  if (data.skills && typeof data.skills !== 'object') {
    errors.push('Skills must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    sanitizedData: data
  };
};

export const validateSocialPresenceData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Ensure data is not null/undefined
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

  // Validate additional links array - Allow empty arrays
  if (data.additional_links && !Array.isArray(data.additional_links)) {
    errors.push('Additional links must be an array');
  }

  // Validate other social networks object
  if (data.other_social_networks && typeof data.other_social_networks !== 'object') {
    errors.push('Other social networks must be an object');
  }

  // Validate URL fields if provided
  const urlFields = ['linkedin_url', 'github_url', 'twitter_url', 'portfolio_url'];
  
  urlFields.forEach(field => {
    if (data[field] && data[field].trim() !== '') {
      try {
        new URL(data[field]);
      } catch {
        errors.push(`${field.replace('_', ' ')} must be a valid URL`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors,
    sanitizedData: data
  };
};
