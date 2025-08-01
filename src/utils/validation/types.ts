
/**
 * Enhanced validation types with complete coverage
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

// Specific validation types for different domains
export interface EmailValidationRule extends ValidationRule {
  allowDisposable?: boolean;
  allowInternational?: boolean;
  requireTLD?: boolean;
  blockedDomains?: string[];
  allowedDomains?: string[];
}

export interface PasswordValidationRule extends ValidationRule {
  minUppercase?: number;
  minLowercase?: number;
  minNumbers?: number;
  minSpecialChars?: number;
  forbiddenPasswords?: string[];
  requireMixedCase?: boolean;
  allowUserInfo?: boolean;
}

export interface PhoneValidationRule extends ValidationRule {
  country?: string;
  format?: 'international' | 'national' | 'e164';
  allowExtensions?: boolean;
  allowIncomplete?: boolean;
}

export interface DateValidationRule extends ValidationRule {
  format?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  allowFuture?: boolean;
  allowPast?: boolean;
}

export interface FileValidationRule extends ValidationRule {
  maxSize?: number;
  minSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  requireImage?: boolean;
  imageDimensions?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    aspectRatio?: number;
  };
}

// Profile-specific validation types
export interface ProfileValidationSchema {
  basicInfo: ValidationSchema;
  contactInfo: ValidationSchema;
  workInfo: ValidationSchema;
  technicalInfo: ValidationSchema;
  socialPresence: ValidationSchema;
  preferences: ValidationSchema;
}

export interface ProfileValidationResult extends ValidationResult {
  sectionResults: {
    basicInfo: ValidationResult;
    contactInfo: ValidationResult;
    workInfo: ValidationResult;
    technicalInfo: ValidationResult;
    socialPresence: ValidationResult;
    preferences: ValidationResult;
  };
  completionPercentage: number;
  requiredFieldsMissing: string[];
  recommendedFieldsMissing: string[];
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

// API validation types
export interface APIValidationError {
  field: string;
  code: string;
  message: string;
  value: any;
  constraint?: string;
}

export interface APIValidationResponse {
  isValid: boolean;
  errors: APIValidationError[];
  warnings: APIValidationError[];
  metadata?: Record<string, any>;
}

// Validation middleware types
export interface ValidationMiddleware {
  name: string;
  priority: number;
  validate: (context: ValidationContext) => ValidationResult | Promise<ValidationResult>;
  shouldRun: (context: ValidationContext) => boolean;
}

// Custom validator types
export interface CustomValidator {
  name: string;
  message: string;
  validate: (value: any, context: ValidationContext) => boolean | string | Promise<boolean | string>;
}

// Validation cache types
export interface ValidationCacheEntry {
  field: string;
  value: any;
  result: ValidationResult;
  timestamp: number;
  ttl: number;
}

export interface ValidationCache {
  get(key: string): ValidationCacheEntry | null;
  set(key: string, entry: ValidationCacheEntry): void;
  clear(field?: string): void;
  cleanup(): void;
}
