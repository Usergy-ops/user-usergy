
/**
 * Advanced input validation and sanitization utilities
 */

import { sanitizeInput } from './security';
import { monitoring } from './monitoring';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  sanitize?: boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

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
export const sanitizeForDatabase = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potential SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /('|(\')|"|(\")|(;)|(\|)|(\*)|(\%))/g,
    /((\-\-)|(\#)|(\/*)|(\*/))/g
  ];
  
  let sanitized = input;
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
};

// Advanced validation engine
export const validateInput = (data: Record<string, any>, schema: ValidationSchema): ValidationResult => {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};
  
  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    
    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
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
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
        continue;
      }
      
      if (rule.maxLength && processedValue.length > rule.maxLength) {
        errors[field] = `${field} cannot exceed ${rule.maxLength} characters`;
        continue;
      }
      
      if (rule.pattern && !rule.pattern.test(processedValue)) {
        errors[field] = `${field} format is invalid`;
        continue;
      }
    }
    
    // Custom validation
    if (rule.customValidator && !rule.customValidator(processedValue)) {
      errors[field] = `${field} validation failed`;
      continue;
    }
    
    sanitizedData[field] = processedValue;
  }
  
  // Log validation attempts
  monitoring.recordMetric('input_validation', 1, {
    valid: Object.keys(errors).length === 0 ? 'true' : 'false',
    error_count: Object.keys(errors).length.toString(),
    field_count: Object.keys(schema).length.toString()
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
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
    },
    country: {
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitize: true
    },
    city: {
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitize: true
    },
    phone_number: {
      required: false,
      pattern: /^[\+]?[\d\s\-\(\)]+$/,
      sanitize: true
    },
    bio: {
      required: false,
      maxLength: 500,
      sanitize: true
    }
  },
  
  socialPresence: {
    linkedin_url: {
      required: false,
      pattern: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/,
      sanitize: true
    },
    github_url: {
      required: false,
      pattern: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9\-]+\/?$/,
      sanitize: true
    },
    twitter_url: {
      required: false,
      pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/,
      sanitize: true
    },
    portfolio_url: {
      required: false,
      pattern: /^https?:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(\/.*)?$/,
      sanitize: true
    }
  },
  
  techFluency: {
    coding_experience_years: {
      required: true,
      customValidator: (value: number) => Number.isInteger(value) && value >= 0 && value <= 50
    },
    ai_models_used: {
      required: true,
      customValidator: (value: string[]) => Array.isArray(value) && value.length > 0
    },
    ai_interests: {
      required: true,
      customValidator: (value: string[]) => Array.isArray(value) && value.length > 0
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
      error: result.errors[field] || null,
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
      error_count: Object.keys(result.errors).length.toString()
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
