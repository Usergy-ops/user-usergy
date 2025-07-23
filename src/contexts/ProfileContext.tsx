
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { SimpleProfileService } from '@/services/simpleProfileService';

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

// Safe data conversion helpers
const safeConvertArray = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const safeConvertObject = (value: any): any => {
  if (typeof value === 'object' && value !== null) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return {};
};

// Convert programming_languages from jsonb to array
const safeConvertProgrammingLanguages = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof value === 'object' && value !== null) {
    // Handle if it's already a parsed object
    return Array.isArray(value) ? value : [];
  }
  return [];
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
      console.log('[ProfileContext] Loading profile data for user:', user.id);

      // Load all data in parallel
      const [profileResult, devicesResult, techFluencyResult, skillsResult, socialPresenceResult] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_devices').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_tech_fluency').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_skills').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_social_presence').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      // Safely extract data
      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const devices = devicesResult.status === 'fulfilled' ? devicesResult.value.data : null;
      const techFluency = techFluencyResult.status === 'fulfilled' ? techFluencyResult.value.data : null;
      const skills = skillsResult.status === 'fulfilled' ? skillsResult.value.data : null;
      const socialPresence = socialPresenceResult.status === 'fulfilled' ? socialPresenceResult.value.data : null;

      // Set profile data
      setProfileData(profile || {});
      
      // Set device data
      setDeviceData({
        operating_systems: devices ? safeConvertArray(devices.operating_systems) : [],
        devices_owned: devices ? safeConvertArray(devices.devices_owned) : [],
        mobile_manufacturers: devices ? safeConvertArray(devices.mobile_manufacturers) : [],
        desktop_manufacturers: devices ? safeConvertArray(devices.desktop_manufacturers) : [],
        email_clients: devices ? safeConvertArray(devices.email_clients) : [],
        streaming_subscriptions: devices ? safeConvertArray(devices.streaming_subscriptions) : [],
        music_subscriptions: devices ? safeConvertArray(devices.music_subscriptions) : [],
      });

      // Set tech fluency data with proper programming_languages conversion
      setTechFluencyData({
        ai_interests: techFluency ? safeConvertArray(techFluency.ai_interests) : [],
        ai_models_used: techFluency ? safeConvertArray(techFluency.ai_models_used) : [],
        programming_languages: techFluency ? safeConvertProgrammingLanguages(techFluency.programming_languages) : [],
        coding_experience_years: techFluency?.coding_experience_years || 0,
      });

      // Set skills data
      setSkillsData({
        skills: skills ? safeConvertObject(skills.skills) : {},
        interests: skills ? safeConvertArray(skills.interests) : [],
        product_categories: skills ? safeConvertArray(skills.product_categories) : [],
      });

      // Set social presence data
      setSocialPresenceData({
        other_social_networks: socialPresence ? safeConvertObject(socialPresence.other_social_networks) : {},
        additional_links: socialPresence ? safeConvertArray(socialPresence.additional_links) : [],
      });

      console.log('[ProfileContext] Profile data loaded successfully');
    } catch (error) {
      console.error('[ProfileContext] Error loading profile data:', error);
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
      console.log(`[ProfileContext] Updating ${section} with data:`, data);
      
      // Remove empty values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => 
          value !== undefined && 
          value !== null && 
          value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        )
      );

      console.log(`[ProfileContext] Clean data for ${section}:`, cleanData);

      // Save to database using simplified service
      switch (section) {
        case 'profile':
          await SimpleProfileService.saveProfile(user.id, user.email || '', cleanData);
          setProfileData(prev => ({ ...prev, ...cleanData }));
          break;
        case 'devices':
          await SimpleProfileService.saveDevices(user.id, cleanData);
          setDeviceData(prev => ({ ...prev, ...cleanData }));
          break;
        case 'tech_fluency':
          await SimpleProfileService.saveTechFluency(user.id, cleanData);
          setTechFluencyData(prev => ({ ...prev, ...cleanData }));
          break;
        case 'skills':
          await SimpleProfileService.saveSkills(user.id, cleanData);
          setSkillsData(prev => ({ ...prev, ...cleanData }));
          break;
        case 'social_presence':
          await SimpleProfileService.saveSocialPresence(user.id, cleanData);
          setSocialPresenceData(prev => ({ ...prev, ...cleanData }));
          break;
        default:
          throw new Error(`Unknown section: ${section}`);
      }

      console.log(`[ProfileContext] Successfully updated ${section}`);
    } catch (error) {
      console.error(`[ProfileContext] Error updating ${section}:`, error);
      throw error;
    }
  };

  const autoSaveData = async () => {
    console.log('[ProfileContext] Auto-save triggered');
    // Placeholder for auto-save functionality
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
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
    } catch (error) {
      console.error('[ProfileContext] Error uploading profile picture:', error);
      throw error;
    }
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
