
import { ValidationRule, ValidationResult, ValidationSchema } from './types';

// Email validation
export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain && !commonDomains.includes(domain)) {
    const suggestions = commonDomains.filter(d => 
      d.includes(domain.substring(0, 3)) || domain.includes(d.substring(0, 3))
    );
    
    if (suggestions.length > 0) {
      return `Did you mean ${email.split('@')[0]}@${suggestions[0]}?`;
    }
  }
  
  return null;
};

// Password validation with strength scoring
export const validatePassword = (password: string, isSignup: boolean = false): { 
  isValid: boolean; 
  error: string | null; 
  strength: number; 
  feedback: string[] 
} => {
  const feedback: string[] = [];
  let strength = 0;

  if (!password) {
    return {
      isValid: false,
      error: 'Password is required',
      strength: 0,
      feedback: []
    };
  }

  if (isSignup) {
    if (password.length < 12) {
      feedback.push('Use at least 12 characters');
    } else {
      strength += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Include uppercase letters');
    } else {
      strength += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Include lowercase letters');
    } else {
      strength += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Include numbers');
    } else {
      strength += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Include special characters');
    } else {
      strength += 1;
    }

    // Check for common weak patterns
    const weakPatterns = [
      /(.)\1{2,}/,  // Repeated characters
      /123456|abcdef|qwerty/i,  // Common sequences
      /password|123456|qwerty/i  // Common passwords
    ];

    if (weakPatterns.some(pattern => pattern.test(password))) {
      feedback.push('Avoid common patterns and sequences');
      strength = Math.max(0, strength - 1);
    }

    const isValid = strength >= 3 && feedback.length === 0;
    const error = isValid ? null : `Password is too weak. ${feedback.join(', ')}`;

    return {
      isValid,
      error,
      strength,
      feedback
    };
  }

  // For signin, just check if password exists
  return {
    isValid: true,
    error: null,
    strength: password.length > 0 ? 3 : 0,
    feedback: []
  };
};

// OTP validation
export const validateOTP = (otp: string): string | null => {
  if (!otp) return 'Verification code is required';
  
  if (!/^\d{6}$/.test(otp)) {
    return 'Verification code must be 6 digits';
  }
  
  return null;
};

// Account type validation
export const validateAccountType = (accountType: string | null): string | null => {
  if (!accountType) return 'Account type is required';
  
  if (!['user', 'client'].includes(accountType)) {
    return 'Invalid account type';
  }
  
  return null;
};

// Comprehensive form validation
export const validateAuthForm = (
  email: string,
  password: string,
  mode: 'signin' | 'signup'
): ValidationResult => {
  const errors: Record<string, string[]> = {};
  const fieldErrors: Record<string, string[]> = {};
  
  // Validate email
  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = [emailError];
    fieldErrors.email = [emailError];
  }
  
  // Validate password
  const passwordValidation = validatePassword(password, mode === 'signup');
  if (!passwordValidation.isValid && passwordValidation.error) {
    errors.password = [passwordValidation.error];
    fieldErrors.password = [passwordValidation.error];
  }
  
  const isValid = Object.keys(errors).length === 0;
  
  return {
    isValid,
    errors: Object.values(errors).flat(),
    fieldErrors,
    sanitizedData: {
      email: email.toLowerCase().trim(),
      password: password
    },
    summary: {
      totalFields: 2,
      validFields: isValid ? 2 : 2 - Object.keys(errors).length,
      invalidFields: Object.keys(errors).length,
      warningFields: 0
    }
  };
};

// Authentication schema for consistent validation
export const authValidationSchema: ValidationSchema = {
  email: {
    required: true,
    customValidator: (value: string) => validateEmail(value) === null
  },
  password: {
    required: true,
    minLength: 12,
    customValidator: (value: string) => {
      const result = validatePassword(value, true);
      return result.isValid;
    }
  },
  otp: {
    required: true,
    pattern: /^\d{6}$/,
    customValidator: (value: string) => validateOTP(value) === null
  },
  accountType: {
    required: true,
    customValidator: (value: string) => validateAccountType(value) === null
  }
};

// Utility function to get user-friendly error messages
export const getAuthErrorMessage = (error: string, context?: string): string => {
  const errorLower = error.toLowerCase();
  
  // Authentication specific errors
  if (errorLower.includes('invalid login credentials') || errorLower.includes('invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (errorLower.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  
  if (errorLower.includes('user already registered') || errorLower.includes('already exists')) {
    return 'This email is already registered. Please sign in instead.';
  }
  
  if (errorLower.includes('too many requests') || errorLower.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return 'Connection failed. Please check your internet connection and try again.';
  }
  
  // OTP specific errors
  if (context?.includes('otp')) {
    if (errorLower.includes('expired')) {
      return 'Verification code has expired. Please request a new code.';
    }
    if (errorLower.includes('invalid') || errorLower.includes('incorrect')) {
      return 'Invalid verification code. Please check your code and try again.';
    }
    if (errorLower.includes('blocked') || errorLower.includes('too many')) {
      return 'Too many failed attempts. Please try again later.';
    }
  }
  
  // Google OAuth errors
  if (context?.includes('google') || context?.includes('oauth')) {
    if (errorLower.includes('popup')) {
      return 'Popup was blocked. Please allow popups for this site and try again.';
    }
    if (errorLower.includes('cancelled')) {
      return 'Authentication was cancelled. Please try again.';
    }
  }
  
  // Default fallback
  return error || 'An unexpected error occurred';
};
