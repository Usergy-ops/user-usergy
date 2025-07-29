
/**
 * Form-specific validation utilities that handle auto-save vs final submission contexts
 */

import { ValidationResult } from './types';
import { validateTechFluencyData } from './profileValidation';

export const validateForAutoSave = (data: any, dataType: string): ValidationResult => {
  const errors: string[] = [];
  
  // For auto-save, we only validate format/type issues, not required fields
  switch (dataType) {
    case 'profile':
      // Only validate format issues during auto-save
      if (data.full_name && data.full_name.trim() !== '' && (data.full_name.trim().length < 2 || data.full_name.trim().length > 100)) {
        errors.push('Full name must be between 2 and 100 characters');
      }
      
      if (data.email && data.email.trim() !== '' && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
        errors.push('Invalid email format');
      }
      break;
      
    case 'tech_fluency':
      // Use the updated validation function with auto-save context
      return validateTechFluencyData(data, true);
      
    case 'skills':
      // For auto-save, just validate types but allow empty arrays
      if (data.interests && !Array.isArray(data.interests)) {
        errors.push('Interests must be an array');
      }
      if (data.product_categories && !Array.isArray(data.product_categories)) {
        errors.push('Product categories must be an array');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: data
  };
};

export const validateForSubmission = (data: any, dataType: string): ValidationResult => {
  const errors: string[] = [];
  
  // For final submission, validate all requirements
  switch (dataType) {
    case 'profile':
      if (!data.full_name || data.full_name.trim() === '') {
        errors.push('Full name is required');
      } else if (data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
        errors.push('Full name must be between 2 and 100 characters');
      }
      
      if (!data.email || data.email.trim() === '') {
        errors.push('Email is required');
      } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
        errors.push('Invalid email format');
      }
      break;
      
    case 'tech_fluency':
      // Use the updated validation function for final submission
      return validateTechFluencyData(data, false);
      
    case 'skills':
      if (!data.interests || !Array.isArray(data.interests) || data.interests.length === 0) {
        errors.push('At least one interest is required');
      }
      if (!data.languages_spoken || !Array.isArray(data.languages_spoken) || data.languages_spoken.length === 0) {
        errors.push('At least one language is required');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: data
  };
};
