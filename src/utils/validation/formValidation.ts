
import { ValidationResult, ValidationSchema } from './types';
import { sanitizeForDatabase } from './inputValidation';
import { monitoring } from '../monitoring';

export const validateForAutoSave = (
  data: Record<string, any>,
  section: string
): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  let sanitizedData: Record<string, any> = {};

  try {
    // Sanitize all input data
    sanitizedData = sanitizeForDatabase(data);
    
    // Auto-save validation is more lenient - only check critical fields
    const criticalFields: Record<string, string[]> = {
      'basicInfo': ['email'],
      'contactInfo': [],
      'workInfo': [],
      'technicalInfo': [],
      'socialPresence': [],
      'preferences': []
    };
    
    const fieldsToCheck = criticalFields[section] || [];
    
    fieldsToCheck.forEach(field => {
      if (!sanitizedData[field]) {
        const error = `${field} is required`;
        errors.push(error);
        fieldErrors[field] = [error];
      }
    });
    
    monitoring.recordMetric('form_validation_auto_save', 1, {
      section,
      valid: errors.length === 0 ? 'true' : 'false',
      error_count: errors.length.toString()
    });
  } catch (error) {
    console.error('Auto-save validation error:', error);
    errors.push('Validation error occurred');
  }

  const totalFields = Object.keys(data).length;
  const invalidFields = Object.keys(fieldErrors).length;

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
    sanitizedData,
    summary: {
      totalFields,
      validFields: totalFields - invalidFields,
      invalidFields,
      warningFields: 0
    }
  };
};

export const validateForSubmission = (
  data: Record<string, any>,
  section: string
): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  let sanitizedData: Record<string, any> = {};

  try {
    // Sanitize all input data
    sanitizedData = sanitizeForDatabase(data);
    
    // Submission validation is strict - check all required fields
    const requiredFields: Record<string, string[]> = {
      'basicInfo': ['email', 'full_name', 'country', 'timezone'],
      'contactInfo': ['phone', 'address'],
      'workInfo': ['company', 'position'],
      'technicalInfo': ['experience_level'],
      'socialPresence': [],
      'preferences': ['notification_preferences']
    };
    
    const fieldsToCheck = requiredFields[section] || [];
    
    fieldsToCheck.forEach(field => {
      if (!sanitizedData[field]) {
        const error = `${field.replace(/_/g, ' ')} is required`;
        errors.push(error);
        fieldErrors[field] = [error];
      }
    });
    
    // Additional validation logic based on section
    if (section === 'basicInfo' && sanitizedData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedData.email)) {
        const error = 'Invalid email format';
        errors.push(error);
        fieldErrors.email = [error];
      }
    }
    
    monitoring.recordMetric('form_validation_submission', 1, {
      section,
      valid: errors.length === 0 ? 'true' : 'false',
      error_count: errors.length.toString()
    });
  } catch (error) {
    console.error('Submission validation error:', error);
    errors.push('Validation error occurred');
  }

  const totalFields = Object.keys(data).length;
  const invalidFields = Object.keys(fieldErrors).length;

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
    sanitizedData,
    summary: {
      totalFields,
      validFields: totalFields - invalidFields,
      invalidFields,
      warningFields: 0
    }
  };
};
