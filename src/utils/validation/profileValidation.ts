
/**
 * Profile-specific validation utilities - fixed with complete ValidationResult interface
 */

import { validateEmail, validateAge, validateCompletionPercentage, validateCodingExperience } from '../security';
import { ValidationResult } from './types';

const createValidationResult = (
  errors: string[],
  data: any,
  fieldErrors: Record<string, string[]> = {}
): ValidationResult => {
  const totalFields = Object.keys(data).length;
  const invalidFields = Object.keys(fieldErrors).length;

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
    sanitizedData: data,
    summary: {
      totalFields,
      validFields: totalFields - invalidFields,
      invalidFields,
      warningFields: 0
    }
  };
};

export const validateProfileData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  // Ensure data is not null/undefined
  if (!data || typeof data !== 'object') {
    return createValidationResult(['Invalid data format'], {}, { data: ['Invalid data format'] });
  }

  // For auto-save, only validate format, not required fields
  if (isAutoSave) {
    // Email validation - only if provided
    if (data.email && data.email.trim() !== '' && !validateEmail(data.email)) {
      const error = 'Invalid email format';
      errors.push(error);
      fieldErrors.email = [error];
    }

    // Age validation - only if provided
    if (data.age !== undefined && data.age !== null && !validateAge(data.age)) {
      const error = 'Age must be between 13 and 120';
      errors.push(error);
      fieldErrors.age = [error];
    }

    // Full name validation - only if provided and not empty
    if (data.full_name && data.full_name.trim() !== '' && (data.full_name.trim().length < 2 || data.full_name.trim().length > 100)) {
      const error = 'Full name must be between 2 and 100 characters';
      errors.push(error);
      fieldErrors.full_name = [error];
    }
  } else {
    // For final submission, validate required fields
    if (!data.email || data.email.trim() === '') {
      const error = 'Email is required';
      errors.push(error);
      fieldErrors.email = [error];
    } else if (!validateEmail(data.email)) {
      const error = 'Invalid email format';
      errors.push(error);
      fieldErrors.email = [error];
    }

    if (!data.full_name || data.full_name.trim() === '') {
      const error = 'Full name is required';
      errors.push(error);
      fieldErrors.full_name = [error];
    } else if (data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
      const error = 'Full name must be between 2 and 100 characters';
      errors.push(error);
      fieldErrors.full_name = [error];
    }
  }

  // Optional field validations
  if (data.date_of_birth) {
    const dateValue = new Date(data.date_of_birth);
    if (isNaN(dateValue.getTime())) {
      const error = 'Invalid date of birth format';
      errors.push(error);
      fieldErrors.date_of_birth = [error];
    } else {
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
      
      if (dateValue < minDate || dateValue > maxDate) {
        const error = 'Date of birth must be between 13 and 120 years ago';
        errors.push(error);
        fieldErrors.date_of_birth = [error];
      }
    }
  }

  if (data.completion_percentage !== undefined && data.completion_percentage !== null && !validateCompletionPercentage(data.completion_percentage)) {
    const error = 'Completion percentage must be between 0 and 100';
    errors.push(error);
    fieldErrors.completion_percentage = [error];
  }

  if (data.languages_spoken && !Array.isArray(data.languages_spoken)) {
    const error = 'Languages spoken must be an array';
    errors.push(error);
    fieldErrors.languages_spoken = [error];
  }

  return createValidationResult(errors, data, fieldErrors);
};

export const validateDeviceData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  if (!data || typeof data !== 'object') {
    return createValidationResult(['Invalid data format'], {}, { data: ['Invalid data format'] });
  }

  const arrayFields = ['operating_systems', 'devices_owned', 'mobile_manufacturers', 'email_clients'];
  
  arrayFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      if (!Array.isArray(data[field])) {
        const error = `${field.replace('_', ' ')} must be an array`;
        errors.push(error);
        fieldErrors[field] = [error];
      } else if (!isAutoSave && field === 'operating_systems' && data[field].length === 0) {
        const error = 'At least one operating system is required';
        errors.push(error);
        fieldErrors[field] = [error];
      } else if (!isAutoSave && field === 'devices_owned' && data[field].length === 0) {
        const error = 'At least one device is required';
        errors.push(error);
        fieldErrors[field] = [error];
      }
    }
  });

  return createValidationResult(errors, data, fieldErrors);
};

export const validateTechFluencyData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  if (!data || typeof data !== 'object') {
    return createValidationResult(['Invalid data format'], {}, { data: ['Invalid data format'] });
  }

  // Only validate tech fluency fields, never profile fields
  if (data.coding_experience_years !== undefined && data.coding_experience_years !== null) {
    if (!validateCodingExperience(data.coding_experience_years)) {
      const error = 'Coding experience must be between 0 and 50 years';
      errors.push(error);
      fieldErrors.coding_experience_years = [error];
    }
  }

  const arrayFields = ['ai_models_used', 'ai_interests', 'programming_languages'];
  
  arrayFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      if (!Array.isArray(data[field])) {
        const error = `${field.replace('_', ' ')} must be an array`;
        errors.push(error);
        fieldErrors[field] = [error];
      } else if (!isAutoSave && (field === 'ai_models_used' || field === 'ai_interests')) {
        if (data[field].length === 0) {
          const error = `${field.replace('_', ' ')} is required`;
          errors.push(error);
          fieldErrors[field] = [error];
        }
      }
    }
  });

  return createValidationResult(errors, data, fieldErrors);
};

export const validateSkillsData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  if (!data || typeof data !== 'object') {
    return createValidationResult(['Invalid data format'], {}, { data: ['Invalid data format'] });
  }

  // Only validate skills fields, never profile fields
  if (data.interests !== undefined && data.interests !== null) {
    if (!Array.isArray(data.interests)) {
      const error = 'Interests must be an array';
      errors.push(error);
      fieldErrors.interests = [error];
    } else if (!isAutoSave && data.interests.length === 0) {
      const error = 'At least one interest is required';
      errors.push(error);
      fieldErrors.interests = [error];
    }
  }

  if (data.product_categories && !Array.isArray(data.product_categories)) {
    const error = 'Product categories must be an array';
    errors.push(error);
    fieldErrors.product_categories = [error];
  }

  if (data.skills && typeof data.skills !== 'object') {
    const error = 'Skills must be an object';
    errors.push(error);
    fieldErrors.skills = [error];
  }

  return createValidationResult(errors, data, fieldErrors);
};

export const validateSocialPresenceData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  if (!data || typeof data !== 'object') {
    return createValidationResult(['Invalid data format'], {}, { data: ['Invalid data format'] });
  }

  // Only validate social presence fields, never profile fields
  if (data.additional_links && !Array.isArray(data.additional_links)) {
    const error = 'Additional links must be an array';
    errors.push(error);
    fieldErrors.additional_links = [error];
  }

  if (data.other_social_networks && typeof data.other_social_networks !== 'object') {
    const error = 'Other social networks must be an object';
    errors.push(error);
    fieldErrors.other_social_networks = [error];
  }

  const urlFields = ['linkedin_url', 'github_url', 'twitter_url', 'portfolio_url'];
  
  urlFields.forEach(field => {
    if (data[field] && data[field].trim() !== '') {
      try {
        new URL(data[field]);
      } catch {
        const error = `${field.replace('_', ' ')} must be a valid URL`;
        errors.push(error);
        fieldErrors[field] = [error];
      }
    }
  });

  return createValidationResult(errors, data, fieldErrors);
};
