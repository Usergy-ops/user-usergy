
/**
 * Enhanced security utilities for input validation and sanitization
 */

// Email validation regex
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Strong password requirements
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Common password patterns to reject
const WEAK_PASSWORD_PATTERNS = [
  /^password/i,
  /^123456/,
  /^qwerty/i,
  /^admin/i,
  /^welcome/i,
  /^letmein/i,
  /^monkey/i,
  /^dragon/i,
  /^master/i,
  /^test/i
];

// Sequential patterns to reject
const SEQUENTIAL_PATTERNS = [
  /012345/,
  /123456/,
  /234567/,
  /345678/,
  /456789/,
  /567890/,
  /abcdef/i,
  /bcdefg/i,
  /cdefgh/i,
  /defghi/i,
  /efghij/i,
  /fghijk/i,
  /ghijkl/i,
  /hijklm/i,
  /ijklmn/i,
  /jklmno/i,
  /klmnop/i,
  /lmnopq/i,
  /mnopqr/i,
  /nopqrs/i,
  /opqrst/i,
  /pqrstu/i,
  /qrstuv/i,
  /rstuvw/i,
  /stuvwx/i,
  /tuvwxy/i,
  /uvwxyz/i
];

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
  }
  
  // Check for weak password patterns
  for (const pattern of WEAK_PASSWORD_PATTERNS) {
    if (pattern.test(password)) {
      errors.push('Password contains common weak patterns. Please choose a more secure password.');
      break;
    }
  }
  
  // Check for sequential patterns
  for (const pattern of SEQUENTIAL_PATTERNS) {
    if (pattern.test(password)) {
      errors.push('Password contains sequential characters. Please choose a more secure password.');
      break;
    }
  }
  
  // Check for repeated characters (3 or more in a row)
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password contains too many repeated characters in a row.');
  }
  
  // Check password entropy (basic check)
  const uniqueChars = new Set(password).size;
  const entropyRatio = uniqueChars / password.length;
  if (entropyRatio < 0.6) {
    errors.push('Password lacks sufficient character variety. Please use a more diverse mix of characters.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters and normalize
  return input
    .replace(/[<>'"&]/g, '') // Remove HTML/XSS characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim(); // Remove leading/trailing whitespace
};

export const validateAge = (age: number): boolean => {
  return Number.isInteger(age) && age >= 13 && age <= 120;
};

export const validateCompletionPercentage = (percentage: number): boolean => {
  return Number.isInteger(percentage) && percentage >= 0 && percentage <= 100;
};

export const validateCodingExperience = (years: number): boolean => {
  return Number.isInteger(years) && years >= 0 && years <= 50;
};

export const validateURL = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(normalizedUrl);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const normalizeURL = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
};

// Password strength scoring
export const getPasswordStrength = (password: string): { score: number; feedback: string } => {
  if (!password) return { score: 0, feedback: 'Password is required' };
  
  let score = 0;
  const feedback: string[] = [];
  
  // Length scoring
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  else feedback.push('Use at least 12 characters');
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');
  
  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Add special characters');
  
  // Bonus points for additional complexity
  if (password.length >= 16) score += 1;
  if (/[^A-Za-z0-9@$!%*?&]/.test(password)) score += 1; // Additional special chars
  
  // Deduct points for common patterns
  if (WEAK_PASSWORD_PATTERNS.some(pattern => pattern.test(password))) score -= 2;
  if (SEQUENTIAL_PATTERNS.some(pattern => pattern.test(password))) score -= 1;
  if (/(.)\1{2,}/.test(password)) score -= 1;
  
  score = Math.max(0, Math.min(8, score)); // Clamp between 0-8
  
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthIndex = Math.floor(score / 2);
  const strengthLabel = strengthLabels[strengthIndex] || 'Very Weak';
  
  return {
    score,
    feedback: feedback.length > 0 ? feedback.join(', ') : `Password strength: ${strengthLabel}`
  };
};
