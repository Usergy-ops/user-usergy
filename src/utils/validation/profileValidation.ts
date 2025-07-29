
/**
 * Profile-specific validation utilities - simplified and streamlined
 */

import { ValidationResult } from './types';

export const validateProfileData = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

  // Only validate provided fields - don't require fields during auto-save
  if (data.full_name !== undefined && data.full_name !== null) {
    if (typeof data.full_name === 'string' && data.full_name.trim() !== '') {
      if (data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
        errors.push('Full name must be between 2 and 100 characters');
      }
    }
  }

  if (data.email !== undefined && data.email !== null) {
    if (typeof data.email === 'string' && data.email.trim() !== '') {
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
        errors.push('Invalid email format');
      }
    }
  }

  if (data.age !== undefined && data.age !== null) {
    if (typeof data.age === 'number' && data.age > 0) {
      if (data.age < 13 || data.age > 120) {
        errors.push('Age must be between 13 and 120');
      }
    }
  }

  if (data.date_of_birth !== undefined && data.date_of_birth !== null) {
    if (typeof data.date_of_birth === 'string' && data.date_of_birth.trim() !== '') {
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
  }

  if (data.completion_percentage !== undefined && data.completion_percentage !== null) {
    if (typeof data.completion_percentage === 'number') {
      if (data.completion_percentage < 0 || data.completion_percentage > 100) {
        errors.push('Completion percentage must be between 0 and 100');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    sanitizedData: data
  };
};

export const validateDeviceData = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

  // Validate array fields if they exist
  const arrayFields = ['operating_systems', 'devices_owned', 'mobile_manufacturers', 'email_clients'];
  
  arrayFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      if (!Array.isArray(data[field])) {
        errors.push(`${field.replace('_', ' ')} must be an array`);
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

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

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
      } else if (!isAutoSave && (field === 'ai_models_used' || field === 'ai_interests')) {
        // Only validate required fields during final submission
        if (data[field].length === 0) {
          errors.push(`${field.replace('_', ' ')} is required`);
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

export const validateSkillsData = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

  // Validate interests array
  if (data.interests !== undefined && data.interests !== null) {
    if (!Array.isArray(data.interests)) {
      errors.push('Interests must be an array');
    }
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
    errors: errors,
    sanitizedData: data
  };
};

export const validateSocialPresenceData = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitizedData: {}
    };
  }

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
    errors: errors,
    sanitizedData: data
  };
};
