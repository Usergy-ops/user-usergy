
/**
 * Validation types
 */

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
  errors: string[];
  sanitizedData: Record<string, any>;
}
