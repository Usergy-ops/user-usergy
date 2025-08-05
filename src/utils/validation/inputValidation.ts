
/**
 * Core input validation and sanitization utilities
 */

import { monitoring } from '../monitoring';
import { ValidationRule, ValidationSchema, ValidationResult } from './types';

// Enhanced input sanitization
export const sanitizeUserInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potential XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onclick=/gi,
    /onerror=/gi,
    /onmouseover=/gi
  ];
  
  let sanitized = input;
  xssPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Remove HTML tags but preserve content
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
};

// SQL injection prevention
export const sanitizeForDatabase = (input: Record<string, any>): Record<string, any> => {
  if (!input || typeof input !== 'object') return {};
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Remove potential SQL injection patterns
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /('|(\')|"|(\")|(;)|(\|)|(\*)|(\%))/g,
        /((\-\-)|(\#)|(\/\*)|(\*\/))/g
      ];
      
      let sanitizedValue = value;
      sqlPatterns.forEach(pattern => {
        sanitizedValue = sanitizedValue.replace(pattern, '');
      });
      
      sanitized[key] = sanitizedValue.trim();
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Advanced validation engine
export const validateInput = (data: Record<string, any>, schema: ValidationSchema): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  const sanitizedData: Record<string, any> = {};
  
  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    
    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      const error = `${field} is required`;
      errors.push(error);
      fieldErrors[field] = [error];
      continue;
    }
    
    // Skip validation for optional empty fields
    if (!rule.required && (value === undefined || value === null || value === '')) {
      sanitizedData[field] = value;
      continue;
    }
    
    // Sanitize input if requested
    let processedValue = value;
    if (rule.sanitize && typeof value === 'string') {
      processedValue = sanitizeUserInput(value);
    }
    
    // String validation
    if (typeof processedValue === 'string') {
      if (rule.minLength && processedValue.length < rule.minLength) {
        const error = `${field} must be at least ${rule.minLength} characters`;
        errors.push(error);
        fieldErrors[field] = [error];
        continue;
      }
      
      if (rule.maxLength && processedValue.length > rule.maxLength) {
        const error = `${field} cannot exceed ${rule.maxLength} characters`;
        errors.push(error);
        fieldErrors[field] = [error];
        continue;
      }
      
      if (rule.pattern && !rule.pattern.test(processedValue)) {
        const error = `${field} format is invalid`;
        errors.push(error);
        fieldErrors[field] = [error];
        continue;
      }
    }
    
    // Custom validation
    if (rule.customValidator && !rule.customValidator(processedValue)) {
      const error = `${field} validation failed`;
      errors.push(error);
      fieldErrors[field] = [error];
      continue;
    }
    
    sanitizedData[field] = processedValue;
  }
  
  // Log validation attempts
  monitoring.recordMetric('input_validation', 1, {
    valid: errors.length === 0 ? 'true' : 'false',
    error_count: errors.length.toString(),
    field_count: Object.keys(schema).length.toString()
  });
  
  const totalFields = Object.keys(schema).length;
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

// Predefined validation schemas
export const VALIDATION_SCHEMAS = {
  basicProfile: {
    full_name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitize: true,
      pattern: /^[a-zA-Z\s\-'\.]+$/
    },
    email: {
      required: true,
      pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      sanitize: true
    },
    age: {
      required: true,
      customValidator: (value: number) => Number.isInteger(value) && value >= 13 && value <= 120
    }
  }
};

// Real-time validation hook
export const useRealTimeValidation = (schema: ValidationSchema) => {
  const validateField = (field: string, value: any) => {
    const fieldSchema = { [field]: schema[field] };
    const fieldData = { [field]: value };
    
    const result = validateInput(fieldData, fieldSchema);
    return {
      isValid: result.isValid,
      error: result.errors.length > 0 ? result.errors[0] : null,
      sanitizedValue: result.sanitizedData[field]
    };
  };
  
  const validateAll = (data: Record<string, any>) => {
    return validateInput(data, schema);
  };
  
  return { validateField, validateAll };
};

// Context-aware validation
export const createContextualValidator = (context: string) => {
  return (data: Record<string, any>, schema: ValidationSchema) => {
    const result = validateInput(data, schema);
    
    // Log validation with context
    monitoring.recordMetric('contextual_validation', 1, {
      context,
      valid: result.isValid ? 'true' : 'false',
      error_count: result.errors.length.toString()
    });
    
    if (!result.isValid) {
      monitoring.warn(`Validation failed in ${context}`, 'input_validation', {
        errors: result.errors,
        data: Object.keys(data)
      });
    }
    
    return result;
  };
};
