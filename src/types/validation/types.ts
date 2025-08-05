
/**
 * Validation types - extracted from utils/validation/types.ts for cleaner imports
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean | string | Promise<boolean | string>;
  sanitize?: boolean;
  dependencies?: string[];
  when?: {
    field: string;
    is: any;
    then?: ValidationRule;
    otherwise?: ValidationRule;
  };
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  sanitizedData: Record<string, any>;
  fieldErrors: Record<string, string[]>;
  summary: {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    warningFields: number;
  };
}

export interface ValidationContext {
  field: string;
  value: any;
  formData: Record<string, any>;
  schema: ValidationSchema;
  options: ValidationOptions;
}

export interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  skipFunctions?: boolean;
  skipMissing?: boolean;
  dateFormat?: string;
  messages?: Record<string, string>;
  context?: Record<string, any>;
}

// Form validation types
export interface FormValidationState {
  isValid: boolean;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  validating: Record<string, boolean>;
}

export interface FormValidationConfig {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  revalidateOnSubmit?: boolean;
  shouldUnregister?: boolean;
  delayError?: number;
  criteriaMode?: 'firstError' | 'all';
  mode: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
}
