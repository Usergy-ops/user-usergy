
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { ProfileService } from '@/services/profileService';

interface ProfileData {
  // Basic Profile
  full_name?: string;
  avatar_url?: string;
  phone_number?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  country?: string;
  city?: string;
  timezone?: string;
  
  // Education & Work
  education_level?: string;
  field_of_study?: string;
  job_title?: string;
  employer?: string;
  industry?: string;
  work_role?: string;
  company_size?: string;
  household_income_range?: string;
  
  // Tech Fluency
  technical_experience_level?: string;
  ai_familiarity_level?: string;
  
  // Personal
  bio?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  portfolio_url?: string;
  languages_spoken?: string[];
  
  // Completion tracking
  completion_percentage?: number;
  section_1_completed?: boolean;
  section_2_completed?: boolean;
  section_3_completed?: boolean;
  section_4_completed?: boolean;
  section_5_completed?: boolean;
  section_6_completed?: boolean;
}

interface DeviceData {
  operating_systems?: string[];
  devices_owned?: string[];
  mobile_manufacturers?: string[];
  desktop_manufacturers?: string[];
  email_clients?: string[];
  streaming_subscriptions?: string[];
  music_subscriptions?: string[];
}

interface TechFluencyData {
  ai_interests?: string[];
  ai_models_used?: string[];
  programming_languages?: string[];
  coding_experience_years?: number;
}

interface SkillsData {
  skills?: any;
  interests?: string[];
  product_categories?: string[];
}

interface SocialPresenceData {
  other_social_networks?: any;
  additional_links?: string[];
}

interface ProfileContextType {
  profileData: ProfileData;
  deviceData: DeviceData;
  techFluencyData: TechFluencyData;
  skillsData: SkillsData;
  socialPresenceData: SocialPresenceData;
  loading: boolean;
  currentStep: number;
  updateProfileData: (section: string, data: any) => Promise<void>;
  setCurrentStep: (step: number) => void;
  uploadProfilePicture: (file: File) => Promise<string>;
  autoSaveData: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

// Helper function to safely convert Json to expected types
const convertJsonToType = (value: any, expectedType: 'string[]' | 'object'): any => {
  if (value === null || value === undefined) {
    return expectedType === 'string[]' ? [] : {};
  }
  
  if (expectedType === 'string[]') {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }
  
  if (expectedType === 'object') {
    if (typeof value === 'object' && value !== null) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return {};
  }
  
  return value;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [techFluencyData, setTechFluencyData] = useState<TechFluencyData>({});
  const [skillsData, setSkillsData] = useState<SkillsData>({});
  const [socialPresenceData, setSocialPresenceData] = useState<SocialPresenceData>({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // Load current step from localStorage
  useEffect(() => {
    const savedStep = localStorage.getItem('profileCurrentStep');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
  }, []);

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem('profileCurrentStep', currentStep.toString());
  }, [currentStep]);

  const loadProfileData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading profile data for user:', user.id);

      // Load all data in parallel
      const [profileResult, devicesResult, techFluencyResult, skillsResult, socialPresenceResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_devices').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_tech_fluency').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_skills').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_social_presence').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      // Set data with proper type conversion
      setProfileData(profileResult.data || {});
      
      // Convert device data arrays from Json to string[]
      const deviceDataConverted = devicesResult.data ? {
        ...devicesResult.data,
        operating_systems: convertJsonToType(devicesResult.data.operating_systems, 'string[]'),
        devices_owned: convertJsonToType(devicesResult.data.devices_owned, 'string[]'),
        mobile_manufacturers: convertJsonToType(devicesResult.data.mobile_manufacturers, 'string[]'),
        desktop_manufacturers: convertJsonToType(devicesResult.data.desktop_manufacturers, 'string[]'),
        email_clients: convertJsonToType(devicesResult.data.email_clients, 'string[]'),
        streaming_subscriptions: convertJsonToType(devicesResult.data.streaming_subscriptions, 'string[]'),
        music_subscriptions: convertJsonToType(devicesResult.data.music_subscriptions, 'string[]'),
      } : {};
      setDeviceData(deviceDataConverted);

      // Convert tech fluency data arrays from Json to string[]
      const techFluencyDataConverted = techFluencyResult.data ? {
        ...techFluencyResult.data,
        ai_interests: convertJsonToType(techFluencyResult.data.ai_interests, 'string[]'),
        ai_models_used: convertJsonToType(techFluencyResult.data.ai_models_used, 'string[]'),
        programming_languages: convertJsonToType(techFluencyResult.data.programming_languages, 'string[]'),
      } : {};
      setTechFluencyData(techFluencyDataConverted);

      // Convert skills data
      const skillsDataConverted = skillsResult.data ? {
        ...skillsResult.data,
        skills: convertJsonToType(skillsResult.data.skills, 'object'),
        interests: convertJsonToType(skillsResult.data.interests, 'string[]'),
        product_categories: convertJsonToType(skillsResult.data.product_categories, 'string[]'),
      } : {};
      setSkillsData(skillsDataConverted);

      // Convert social presence data
      const socialPresenceDataConverted = socialPresenceResult.data ? {
        ...socialPresenceResult.data,
        other_social_networks: convertJsonToType(socialPresenceResult.data.other_social_networks, 'object'),
        additional_links: convertJsonToType(socialPresenceResult.data.additional_links, 'string[]'),
      } : {};
      setSocialPresenceData(socialPresenceDataConverted);

      console.log('Profile data loaded successfully');
    } catch (error) {
      console.error('Error loading profile data:', error);
      // Don't throw - just log and continue
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [user, loadProfileData]);

  const updateProfileData = async (section: string, data: any) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log(`Updating ${section} data:`, data);
      
      // Save to database using the service
      await ProfileService.saveProfileData(section, data, user.id, user.email || '');
      
      // Update local state only after successful save
      switch (section) {
        case 'profile':
          setProfileData(prev => ({ ...prev, ...data }));
          break;
        case 'devices':
          setDeviceData(prev => ({ ...prev, ...data }));
          break;
        case 'tech_fluency':
          setTechFluencyData(prev => ({ ...prev, ...data }));
          break;
        case 'skills':
          setSkillsData(prev => ({ ...prev, ...data }));
          break;
        case 'social_presence':
          setSocialPresenceData(prev => ({ ...prev, ...data }));
          break;
      }

      console.log(`Successfully updated ${section} data`);
    } catch (error) {
      console.error(`Error updating ${section} data:`, error);
      throw error;
    }
  };

  const autoSaveData = async () => {
    // Simplified auto-save - just a placeholder for now
    console.log('Auto-save triggered');
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const value = {
    profileData,
    deviceData,
    techFluencyData,
    skillsData,
    socialPresenceData,
    loading,
    currentStep,
    updateProfileData,
    setCurrentStep,
    uploadProfilePicture,
    autoSaveData
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
