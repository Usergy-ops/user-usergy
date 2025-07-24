
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { validateEmail, validatePassword, sanitizeInput } from '@/utils/security';

// Enhanced validation schemas for each profile section
export const basicProfileSchema = z.object({
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .transform(sanitizeInput),
  email: z.string()
    .email('Invalid email format')
    .refine(validateEmail, 'Invalid email format'),
  age: z.number()
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Age cannot exceed 120'),
  country: z.string()
    .min(2, 'Country is required')
    .transform(sanitizeInput),
  city: z.string()
    .min(2, 'City is required')
    .transform(sanitizeInput),
  gender: z.string()
    .min(1, 'Gender is required'),
  timezone: z.string()
    .min(1, 'Timezone is required')
});

export const devicesSchema = z.object({
  operating_systems: z.array(z.string())
    .min(1, 'At least one operating system is required'),
  devices_owned: z.array(z.string())
    .min(1, 'At least one device is required'),
  mobile_manufacturers: z.array(z.string())
    .min(1, 'At least one mobile manufacturer is required'),
  email_clients: z.array(z.string())
    .min(1, 'At least one email client is required')
});

export const techFluencySchema = z.object({
  coding_experience_years: z.number()
    .min(0, 'Coding experience cannot be negative')
    .max(50, 'Coding experience cannot exceed 50 years'),
  ai_models_used: z.array(z.string())
    .min(1, 'At least one AI model is required'),
  ai_interests: z.array(z.string())
    .min(1, 'At least one AI interest is required'),
  programming_languages: z.array(z.string())
    .optional()
});

export const skillsSchema = z.object({
  interests: z.array(z.string())
    .min(1, 'At least one interest is required'),
  product_categories: z.array(z.string())
    .min(1, 'At least one product category is required'),
  skills: z.record(z.string(), z.number())
    .optional()
});

export const socialPresenceSchema = z.object({
  linkedin_url: z.string()
    .url('Invalid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  github_url: z.string()
    .url('Invalid GitHub URL')
    .optional()
    .or(z.literal('')),
  twitter_url: z.string()
    .url('Invalid Twitter URL')
    .optional()
    .or(z.literal('')),
  portfolio_url: z.string()
    .url('Invalid portfolio URL')
    .optional()
    .or(z.literal(''))
});

// Enhanced form validation hook
export const useProfileFormValidation = <T extends z.ZodType>(schema: T) => {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange'
  });
};

// Real-time validation component
interface ValidationMessageProps {
  errors: any;
  fieldName: string;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ errors, fieldName }) => {
  if (!errors[fieldName]) return null;
  
  return (
    <div className="text-sm text-destructive mt-1 animate-slide-up">
      {errors[fieldName]?.message}
    </div>
  );
};

// Form field wrapper with enhanced validation
interface ValidatedFieldProps {
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  label: string;
}

export const ValidatedField: React.FC<ValidatedFieldProps> = ({ 
  children, 
  error, 
  required, 
  label 
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <div className="text-sm text-destructive animate-slide-up">
          {error}
        </div>
      )}
    </div>
  );
};
