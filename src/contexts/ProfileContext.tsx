
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

// Safe data conversion helper
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

      // Load all data in parallel with error handling
      const [profileResult, devicesResult, techFluencyResult, skillsResult, socialPresenceResult] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_devices').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_tech_fluency').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_skills').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_social_presence').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      // Safely extract data from results
      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const devices = devicesResult.status === 'fulfilled' ? devicesResult.value.data : null;
      const techFluency = techFluencyResult.status === 'fulfilled' ? techFluencyResult.value.data : null;
      const skills = skillsResult.status === 'fulfilled' ? skillsResult.value.data : null;
      const socialPresence = socialPresenceResult.status === 'fulfilled' ? socialPresenceResult.value.data : null;

      // Set profile data
      setProfileData(profile || {});
      
      // Set device data with safe conversion
      setDeviceData({
        operating_systems: devices ? safeConvertArray(devices.operating_systems) : [],
        devices_owned: devices ? safeConvertArray(devices.devices_owned) : [],
        mobile_manufacturers: devices ? safeConvertArray(devices.mobile_manufacturers) : [],
        desktop_manufacturers: devices ? safeConvertArray(devices.desktop_manufacturers) : [],
        email_clients: devices ? safeConvertArray(devices.email_clients) : [],
        streaming_subscriptions: devices ? safeConvertArray(devices.streaming_subscriptions) : [],
        music_subscriptions: devices ? safeConvertArray(devices.music_subscriptions) : [],
      });

      // Set tech fluency data with safe conversion
      setTechFluencyData({
        ai_interests: techFluency ? safeConvertArray(techFluency.ai_interests) : [],
        ai_models_used: techFluency ? safeConvertArray(techFluency.ai_models_used) : [],
        programming_languages: techFluency ? safeConvertArray(techFluency.programming_languages) : [],
        coding_experience_years: techFluency?.coding_experience_years || 0,
      });

      // Set skills data with safe conversion
      setSkillsData({
        skills: skills ? safeConvertObject(skills.skills) : {},
        interests: skills ? safeConvertArray(skills.interests) : [],
        product_categories: skills ? safeConvertArray(skills.product_categories) : [],
      });

      // Set social presence data with safe conversion
      setSocialPresenceData({
        other_social_networks: socialPresence ? safeConvertObject(socialPresence.other_social_networks) : {},
        additional_links: socialPresence ? safeConvertArray(socialPresence.additional_links) : [],
      });

      console.log('[ProfileContext] Profile data loaded successfully');
    } catch (error) {
      console.error('[ProfileContext] Error loading profile data:', error);
      // Set empty defaults on error
      setProfileData({});
      setDeviceData({});
      setTechFluencyData({});
      setSkillsData({});
      setSocialPresenceData({});
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
      console.log(`[ProfileContext] Updating ${section} data:`, data);
      
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

      console.log(`[ProfileContext] Successfully updated ${section} data`);
    } catch (error) {
      console.error(`[ProfileContext] Error updating ${section} data:`, error);
      // Re-throw the error so components can handle it
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
