
/**
 * Input validation utilities - now using consolidated modules with context awareness
 */

export {
  sanitizeUserInput,
  sanitizeForDatabase,
  validateInput,
  useRealTimeValidation,
  createContextualValidator,
  VALIDATION_SCHEMAS
} from './validation';

export type { ValidationResult, ValidationRule, ValidationSchema } from './validation';
