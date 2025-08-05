
/**
 * Type definitions for profile updater services
 */

export interface ProfileUpdate {
  full_name?: string;
  email?: string;
  bio?: string;
  city?: string;
  country?: string;
  job_title?: string;
  company_size?: string;
  education_level?: string;
  field_of_study?: string;
  work_role?: string;
  technical_experience_level?: string;
  ai_familiarity_level?: string;
  household_income_range?: string;
  industry?: string;
  employer?: string;
  phone_number?: string;
  gender?: string;
  date_of_birth?: string;
  age?: number;
  timezone?: string;
  languages_spoken?: string[];
  availability_hours?: string;
  avatar_url?: string;
  section_1_completed?: boolean;
  section_2_completed?: boolean;
  section_3_completed?: boolean;
  section_4_completed?: boolean;
  section_5_completed?: boolean;
  section_6_completed?: boolean;
  profile_completed?: boolean;
  completion_percentage?: number;
}

export interface DevicesUpdate {
  devices_owned?: string[];
  operating_systems?: string[];
  mobile_manufacturers?: string[];
  desktop_manufacturers?: string[];
  email_clients?: string[];
  streaming_subscriptions?: string[];
  music_subscriptions?: string[];
}

export interface TechFluencyUpdate {
  coding_experience_years?: number;
  programming_languages?: string[];
  ai_interests?: string[];
  ai_models_used?: string[];
}

export interface SkillsUpdate {
  skills?: Record<string, any>;
  interests?: string[];
  product_categories?: string[];
}

export interface SocialPresenceUpdate {
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  portfolio_url?: string;
  additional_links?: string[];
  other_social_networks?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SectionUpdateData {
  profile?: ProfileUpdate;
  devices?: DevicesUpdate;
  tech_fluency?: TechFluencyUpdate;
  skills?: SkillsUpdate;
  social_presence?: SocialPresenceUpdate;
}
