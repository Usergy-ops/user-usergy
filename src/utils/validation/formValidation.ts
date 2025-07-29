
/**
 * Form validation utilities - now using unified validation system
 */

import { ValidationResult } from './types';
import { validateUnified } from './unifiedValidation';

export const validateForAutoSave = (data: any, dataType: string): ValidationResult => {
  return validateUnified(data, {
    isAutoSave: true,
    isSubmission: false,
    isRealTime: false,
    section: dataType
  });
};

export const validateForSubmission = (data: any, dataType: string): ValidationResult => {
  return validateUnified(data, {
    isAutoSave: false,
    isSubmission: true,
    isRealTime: false,
    section: dataType
  });
};

export const validateForRealTime = (data: any, dataType: string): ValidationResult => {
  return validateUnified(data, {
    isAutoSave: false,
    isSubmission: false,
    isRealTime: true,
    section: dataType
  });
};
