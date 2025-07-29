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

  // Handle data type conversion for age field
  if (data.age !== undefined && data.age !== null && data.age !== '') {
    // Convert string to number if needed
    if (typeof data.age === 'string') {
      const ageNum = parseInt(data.age.trim(), 10);
      if (isNaN(ageNum)) {
        errors.push('Age must be a valid number');
      } else {
        sanitizedData.age = ageNum;
      }
    } else if (typeof data.age === 'number') {
      sanitizedData.age = data.age;
    } else {
      errors.push('Age must be a number');
    }

    // Validate age range after conversion
    if (sanitizedData.age !== undefined && (sanitizedData.age < 13 || sanitizedData.age > 120)) {
      errors.push('Age must be between 13 and 120');
    }
  }

  // For auto-save and real-time, only validate format - no required field validation
  if (context.isAutoSave || context.isRealTime) {
    if (data.full_name && typeof data.full_name === 'string' && data.full_name.trim() !== '') {
      if (data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
        errors.push('Full name must be between 2 and 100 characters');
      }
      sanitizedData.full_name = data.full_name.trim();
    }
    
    if (data.email && typeof data.email === 'string' && data.email.trim() !== '') {
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
        errors.push('Invalid email format');
      }
      sanitizedData.email = data.email.trim();
    }

    // Sanitize other string fields
    ['country', 'city', 'timezone', 'gender', 'bio'].forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        sanitizedData[field] = data[field].trim();
      }
    });
  }

  // For submission, validate required fields
  if (context.isSubmission) {
    if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim() === '') {
      errors.push('Full name is required');
    } else {
      if (data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
        errors.push('Full name must be between 2 and 100 characters');
      }
      sanitizedData.full_name = data.full_name.trim();
    }
    
    // Age is required for submission and should be validated after type conversion
    if (data.age === undefined || data.age === null || data.age === '') {
      errors.push('Age is required');
    }

    if (!data.gender || typeof data.gender !== 'string' || data.gender.trim() === '') {
      errors.push('Gender is required');
    } else {
      sanitizedData.gender = data.gender.trim();
    }

    if (!data.country || typeof data.country !== 'string' || data.country.trim() === '') {
      errors.push('Country is required');
    } else {
      sanitizedData.country = data.country.trim();
    }

    if (!data.city || typeof data.city !== 'string' || data.city.trim() === '') {
      errors.push('City is required');
    } else {
      sanitizedData.city = data.city.trim();
    }

    if (!data.timezone || typeof data.timezone !== 'string' || data.timezone.trim() === '') {
      errors.push('Timezone is required');
    } else {
      sanitizedData.timezone = data.timezone.trim();
    }

    // Validate email for submission
    if (data.email && typeof data.email === 'string' && data.email.trim() !== '') {
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
        errors.push('Invalid email format');
      }
      sanitizedData.email = data.email.trim();
    }

    // Sanitize bio if provided
    if (data.bio && typeof data.bio === 'string') {
      sanitizedData.bio = data.bio.trim();
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

  // Coding experience validation with type conversion
  if (data.coding_experience_years !== undefined && data.coding_experience_years !== null) {
    let experienceYears = data.coding_experience_years;
    
    // Convert string to number if needed
    if (typeof experienceYears === 'string') {
      const num = parseInt(experienceYears.trim(), 10);
      if (isNaN(num)) {
        errors.push('Coding experience must be a valid number');
      } else {
        experienceYears = num;
        sanitizedData.coding_experience_years = num;
      }
    }
    
    if (typeof experienceYears === 'number') {
      if (experienceYears < 0 || experienceYears > 50) {
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
        sanitizedData[field] = data[field].trim();
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
