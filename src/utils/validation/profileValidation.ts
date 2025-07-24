
/**
 * Profile-specific validation utilities
 */

import { validateEmail, validateAge, validateCompletionPercentage, validateCodingExperience } from '../security';
import { ValidationResult } from './types';

export const validateProfileData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Email validation
  if (data.email && !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  // Age validation
  if (data.age !== undefined && data.age !== null && !validateAge(data.age)) {
    errors.push('Age must be between 13 and 120');
  }

  // Full name validation
  if (data.full_name && (data.full_name.trim().length < 2 || data.full_name.trim().length > 100)) {
    errors.push('Full name must be between 2 and 100 characters');
  }

  // Completion percentage validation
  if (data.completion_percentage !== undefined && data.completion_percentage !== null && !validateCompletionPercentage(data.completion_percentage)) {
    errors.push('Completion percentage must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.reduce((acc, error, index) => ({ ...acc, [index]: error }), {}),
    sanitizedData: data
  };
};

export const validateDeviceData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Validate arrays are not empty when provided
  const arrayFields = ['operating_systems', 'devices_owned', 'mobile_manufacturers', 'email_clients'];
  
  arrayFields.forEach(field => {
    if (data[field] && (!Array.isArray(data[field]) || data[field].length === 0)) {
      errors.push(`${field.replace('_', ' ')} must be a non-empty array`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors.reduce((acc, error, index) => ({ ...acc, [index]: error }), {}),
    sanitizedData: data
  };
};

export const validateTechFluencyData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Coding experience validation
  if (data.coding_experience_years !== undefined && data.coding_experience_years !== null && !validateCodingExperience(data.coding_experience_years)) {
    errors.push('Coding experience must be between 0 and 50 years');
  }

  // AI models and interests validation
  const arrayFields = ['ai_models_used', 'ai_interests', 'programming_languages'];
  
  arrayFields.forEach(field => {
    if (data[field] && (!Array.isArray(data[field]) || data[field].length === 0)) {
      errors.push(`${field.replace('_', ' ')} must be a non-empty array`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors.reduce((acc, error, index) => ({ ...acc, [index]: error }), {}),
    sanitizedData: data
  };
};

export const validateSkillsData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Validate interests array
  if (data.interests && (!Array.isArray(data.interests) || data.interests.length === 0)) {
    errors.push('Interests must be a non-empty array');
  }

  // Validate product categories array
  if (data.product_categories && (!Array.isArray(data.product_categories) || data.product_categories.length === 0)) {
    errors.push('Product categories must be a non-empty array');
  }

  // Validate skills object
  if (data.skills && typeof data.skills !== 'object') {
    errors.push('Skills must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.reduce((acc, error, index) => ({ ...acc, [index]: error }), {}),
    sanitizedData: data
  };
};

export const validateSocialPresenceData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Validate additional links array
  if (data.additional_links && (!Array.isArray(data.additional_links) || data.additional_links.length === 0)) {
    errors.push('Additional links must be a non-empty array');
  }

  // Validate other social networks object
  if (data.other_social_networks && typeof data.other_social_networks !== 'object') {
    errors.push('Other social networks must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.reduce((acc, error, index) => ({ ...acc, [index]: error }), {}),
    sanitizedData: data
  };
};
