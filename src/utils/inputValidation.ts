
/**
 * Input validation utilities - now using consolidated modules
 * @deprecated Use individual modules from src/utils/validation/ instead
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
