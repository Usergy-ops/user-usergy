
/**
 * Security utilities for input validation and sanitization
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

// Email validation using a comprehensive regex
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// Password validation with comprehensive rules
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Three or more repeated characters
    /123456|654321|abcdef|qwerty/i, // Common sequences
    /password|admin|login|user/i // Common words
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns and is not secure');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize HTML input to prevent XSS
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate and sanitize URL
export const validateAndSanitizeUrl = (url: string): { isValid: boolean; sanitizedUrl?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false };
  }
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false };
    }
    
    return { 
      isValid: true, 
      sanitizedUrl: urlObj.toString() 
    };
  } catch {
    return { isValid: false };
  }
};

// Validate phone number (basic international format)
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's between 10 and 15 digits (international standard)
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

// Rate limiting helpers
export const createSecureIdentifier = (ip: string, userAgent?: string): string => {
  const base = `${ip}_${userAgent || 'unknown'}`;
  // Simple hash to avoid storing raw IP addresses
  return btoa(base).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};

// Input length validation
export const validateInputLength = (input: string, maxLength: number = 1000): boolean => {
  return input && typeof input === 'string' && input.length <= maxLength;
};

// Validate age
export const validateAge = (age: number): boolean => {
  return typeof age === 'number' && age >= 13 && age <= 120 && Number.isInteger(age);
};

// Validate array input
export const validateArrayInput = (input: any, maxItems: number = 50): boolean => {
  return Array.isArray(input) && input.length <= maxItems;
};
