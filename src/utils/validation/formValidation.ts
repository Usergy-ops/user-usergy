
/**
 * Simplified form validation utilities
 */

import { ValidationResult } from './types';

export const validateForAutoSave = (data: any, dataType: string): ValidationResult => {
  const errors: string[] = [];
  
  // For auto-save, we only validate format/type issues, not required fields
  switch (dataType) {
    case 'profile':
      // Only validate format issues during auto-save, don't require fields
      if (data.full_name && typeof data.full_name === 'string' && data.full_name.trim() !== '') {
        if (data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
          errors.push('Full name must be between 2 and 100 characters');
        }
      }
      
      if (data.email && typeof data.email === 'string' && data.email.trim() !== '') {
        if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
          errors.push('Invalid email format');
        }
      }

      if (data.age && (typeof data.age !== 'number' || data.age < 13 || data.age > 120)) {
        errors.push('Age must be between 13 and 120');
      }
      break;
      
    case 'tech_fluency':
      // For auto-save, just validate types but allow empty arrays
      if (data.ai_interests && !Array.isArray(data.ai_interests)) {
        errors.push('AI interests must be an array');
      }
      if (data.ai_models_used && !Array.isArray(data.ai_models_used)) {
        errors.push('AI models used must be an array');
      }
      if (data.programming_languages && !Array.isArray(data.programming_languages)) {
        errors.push('Programming languages must be an array');
      }
      if (data.coding_experience_years && (typeof data.coding_experience_years !== 'number' || data.coding_experience_years < 0 || data.coding_experience_years > 50)) {
        errors.push('Coding experience must be between 0 and 50 years');
      }
      break;
      
    case 'skills':
      // For auto-save, just validate types but allow empty arrays
      if (data.interests && !Array.isArray(data.interests)) {
        errors.push('Interests must be an array');
      }
      if (data.product_categories && !Array.isArray(data.product_categories)) {
        errors.push('Product categories must be an array');
      }
      break;

    case 'devices':
      // For auto-save, just validate types but allow empty arrays
      if (data.operating_systems && !Array.isArray(data.operating_systems)) {
        errors.push('Operating systems must be an array');
      }
      if (data.devices_owned && !Array.isArray(data.devices_owned)) {
        errors.push('Devices owned must be an array');
      }
      break;

    case 'social_presence':
      // For auto-save, just validate URL formats if provided
      const urlFields = ['linkedin_url', 'github_url', 'twitter_url', 'portfolio_url'];
      urlFields.forEach(field => {
        if (data[field] && typeof data[field] === 'string' && data[field].trim() !== '') {
          try {
            new URL(data[field]);
          } catch {
            errors.push(`${field.replace('_', ' ')} must be a valid URL`);
          }
        }
      });
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: data
  };
};

export const validateForSubmission = (data: any, dataType: string): ValidationResult => {
  const errors: string[] = [];
  
  // For final submission, validate all requirements
  switch (dataType) {
    case 'profile':
      if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim() === '') {
        errors.push('Full name is required');
      } else if (data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
        errors.push('Full name must be between 2 and 100 characters');
      }
      
      if (!data.age || typeof data.age !== 'number' || data.age <= 0) {
        errors.push('Age is required');
      } else if (data.age < 13 || data.age > 120) {
        errors.push('Age must be between 13 and 120');
      }

      if (!data.gender || typeof data.gender !== 'string' || data.gender.trim() === '') {
        errors.push('Gender is required');
      }

      if (!data.country || typeof data.country !== 'string' || data.country.trim() === '') {
        errors.push('Country is required');
      }

      if (!data.city || typeof data.city !== 'string' || data.city.trim() === '') {
        errors.push('City is required');
      }

      if (!data.timezone || typeof data.timezone !== 'string' || data.timezone.trim() === '') {
        errors.push('Timezone is required');
      }
      break;
      
    case 'tech_fluency':
      if (!data.technical_experience_level || typeof data.technical_experience_level !== 'string' || data.technical_experience_level.trim() === '') {
        errors.push('Technical experience level is required');
      }

      if (!data.ai_familiarity_level || typeof data.ai_familiarity_level !== 'string' || data.ai_familiarity_level.trim() === '') {
        errors.push('AI familiarity level is required');
      }

      if (!data.ai_interests || !Array.isArray(data.ai_interests) || data.ai_interests.length === 0) {
        errors.push('At least one AI interest is required');
      }

      if (!data.ai_models_used || !Array.isArray(data.ai_models_used) || data.ai_models_used.length === 0) {
        errors.push('At least one AI model is required');
      }
      break;
      
    case 'skills':
      if (!data.interests || !Array.isArray(data.interests) || data.interests.length === 0) {
        errors.push('At least one interest is required');
      }
      break;

    case 'devices':
      if (!data.operating_systems || !Array.isArray(data.operating_systems) || data.operating_systems.length === 0) {
        errors.push('At least one operating system is required');
      }

      if (!data.devices_owned || !Array.isArray(data.devices_owned) || data.devices_owned.length === 0) {
        errors.push('At least one device is required');
      }

      if (!data.mobile_manufacturers || !Array.isArray(data.mobile_manufacturers) || data.mobile_manufacturers.length === 0) {
        errors.push('At least one mobile manufacturer is required');
      }

      if (!data.email_clients || !Array.isArray(data.email_clients) || data.email_clients.length === 0) {
        errors.push('At least one email client is required');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: data
  };
};
