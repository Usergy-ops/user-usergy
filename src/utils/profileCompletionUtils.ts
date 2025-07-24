
/**
 * Profile completion calculation utilities
 * Ensures consistency between frontend and database calculations
 */

import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserDevices = Database['public']['Tables']['user_devices']['Row'];
type UserTechFluency = Database['public']['Tables']['user_tech_fluency']['Row'];
type UserSkills = Database['public']['Tables']['user_skills']['Row'];

export interface ProfileCompletionData {
  profileData: Partial<Profile>;
  deviceData: Partial<UserDevices>;
  techFluencyData: Partial<UserTechFluency>;
  skillsData: Partial<UserSkills>;
}

/**
 * Calculate profile completion percentage using the exact same logic as database function
 * This ensures consistency between frontend and backend calculations
 */
export const calculateProfileCompletionPercentage = (data: ProfileCompletionData): number => {
  const { profileData, deviceData, techFluencyData, skillsData } = data;
  
  // These are the exact 17 fields counted in the database function
  const mandatoryFields = {
    // Basic Profile (6 fields)
    full_name: profileData.full_name,
    country: profileData.country,
    city: profileData.city,
    gender: profileData.gender,
    age: profileData.age,
    timezone: profileData.timezone,
    
    // Devices & Tech (4 fields)
    operating_systems: deviceData.operating_systems,
    devices_owned: deviceData.devices_owned,
    mobile_manufacturers: deviceData.mobile_manufacturers,
    email_clients: deviceData.email_clients,
    
    // Education & Work (1 field)
    education_level: profileData.education_level,
    
    // AI & Tech Fluency (4 fields)
    technical_experience_level: profileData.technical_experience_level,
    ai_familiarity_level: profileData.ai_familiarity_level,
    ai_models_used: techFluencyData.ai_models_used,
    ai_interests: techFluencyData.ai_interests,
    
    // Skills & Interests (2 mandatory fields)
    interests: skillsData.interests,
    languages_spoken: profileData.languages_spoken,
  };

  const totalFields = 17;
  const completedFields = Object.values(mandatoryFields).filter(value => {
    if (Array.isArray(value)) {
      return value && value.length > 0;
    }
    return value && value.toString().trim() !== '';
  }).length;

  return Math.round((completedFields / totalFields) * 100);
};

/**
 * Get list of all mandatory fields for profile completion
 */
export const getMandatoryFields = (): string[] => {
  return [
    // Basic Profile (6 fields)
    'full_name',
    'country',
    'city',
    'gender',
    'age',
    'timezone',
    
    // Devices & Tech (4 fields)
    'operating_systems',
    'devices_owned',
    'mobile_manufacturers',
    'email_clients',
    
    // Education & Work (1 field)
    'education_level',
    
    // AI & Tech Fluency (4 fields)
    'technical_experience_level',
    'ai_familiarity_level',
    'ai_models_used',
    'ai_interests',
    
    // Skills & Interests (2 mandatory fields)
    'interests',
    'languages_spoken',
  ];
};

/**
 * Get completion details for debugging
 */
export const getCompletionDetails = (data: ProfileCompletionData) => {
  const { profileData, deviceData, techFluencyData, skillsData } = data;
  
  const fields = [
    { name: 'full_name', value: profileData.full_name, section: 'Basic Profile' },
    { name: 'country', value: profileData.country, section: 'Basic Profile' },
    { name: 'city', value: profileData.city, section: 'Basic Profile' },
    { name: 'gender', value: profileData.gender, section: 'Basic Profile' },
    { name: 'age', value: profileData.age, section: 'Basic Profile' },
    { name: 'timezone', value: profileData.timezone, section: 'Basic Profile' },
    
    { name: 'operating_systems', value: deviceData.operating_systems, section: 'Devices & Tech' },
    { name: 'devices_owned', value: deviceData.devices_owned, section: 'Devices & Tech' },
    { name: 'mobile_manufacturers', value: deviceData.mobile_manufacturers, section: 'Devices & Tech' },
    { name: 'email_clients', value: deviceData.email_clients, section: 'Devices & Tech' },
    
    { name: 'education_level', value: profileData.education_level, section: 'Education & Work' },
    
    { name: 'technical_experience_level', value: profileData.technical_experience_level, section: 'AI & Tech Fluency' },
    { name: 'ai_familiarity_level', value: profileData.ai_familiarity_level, section: 'AI & Tech Fluency' },
    { name: 'ai_models_used', value: techFluencyData.ai_models_used, section: 'AI & Tech Fluency' },
    { name: 'ai_interests', value: techFluencyData.ai_interests, section: 'AI & Tech Fluency' },
    
    { name: 'interests', value: skillsData.interests, section: 'Skills & Interests' },
    { name: 'languages_spoken', value: profileData.languages_spoken, section: 'Skills & Interests' },
  ];

  const completedFields = fields.filter(field => {
    if (Array.isArray(field.value)) {
      return field.value && field.value.length > 0;
    }
    return field.value && field.value.toString().trim() !== '';
  });

  const missingFields = fields.filter(field => {
    if (Array.isArray(field.value)) {
      return !field.value || field.value.length === 0;
    }
    return !field.value || field.value.toString().trim() === '';
  });

  return {
    total: fields.length,
    completed: completedFields.length,
    percentage: Math.round((completedFields.length / fields.length) * 100),
    completedFields: completedFields.map(f => ({ name: f.name, section: f.section })),
    missingFields: missingFields.map(f => ({ name: f.name, section: f.section })),
  };
};

/**
 * Constants for profile completion
 */
export const PROFILE_COMPLETION_CONSTANTS = {
  TOTAL_MANDATORY_FIELDS: 17,
  SECTIONS: {
    BASIC_PROFILE: 6,
    DEVICES_TECH: 4,
    EDUCATION_WORK: 1,
    AI_TECH_FLUENCY: 4,
    SKILLS_INTERESTS: 2,
  }
} as const;
