
/**
 * Profile-specific validation utilities - now using unified validation system
 */

import { ValidationResult } from './types';
import { validateUnified } from './unifiedValidation';

export const validateProfileData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  return validateUnified(data, {
    isAutoSave,
    isSubmission: !isAutoSave,
    isRealTime: false,
    section: 'profile'
  });
};

export const validateDeviceData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  return validateUnified(data, {
    isAutoSave,
    isSubmission: !isAutoSave,
    isRealTime: false,
    section: 'devices'
  });
};

export const validateTechFluencyData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  return validateUnified(data, {
    isAutoSave,
    isSubmission: !isAutoSave,
    isRealTime: false,
    section: 'tech_fluency'
  });
};

export const validateSkillsData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  return validateUnified(data, {
    isAutoSave,
    isSubmission: !isAutoSave,
    isRealTime: false,
    section: 'skills'
  });
};

export const validateSocialPresenceData = (data: any, isAutoSave: boolean = false): ValidationResult => {
  return validateUnified(data, {
    isAutoSave,
    isSubmission: !isAutoSave,
    isRealTime: false,
    section: 'social_presence'
  });
};
