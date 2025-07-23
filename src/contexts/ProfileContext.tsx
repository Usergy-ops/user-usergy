import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ProfileData {
  // Basic Profile
  full_name?: string;
  avatar_url?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  country?: string;
  city?: string;
  
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
  timezone?: string;
  availability_hours?: string;
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
  programming_languages?: any;
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
  isProfileComplete: boolean;
  updateProfileData: (section: string, data: any) => Promise<void>;
  setCurrentStep: (step: number) => void;
  calculateCompletion: () => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
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

  const isProfileComplete = (profileData.completion_percentage || 0) >= 100;

  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load main profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setProfileData(profile);
      }

      // Load device data
      const { data: devices } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (devices) {
        setDeviceData(devices);
      }

      // Load tech fluency data
      const { data: techFluency } = await supabase
        .from('user_tech_fluency')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (techFluency) {
        setTechFluencyData(techFluency);
      }

      // Load skills data
      const { data: skills } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (skills) {
        setSkillsData(skills);
      }

      // Load social presence data
      const { data: socialPresence } = await supabase
        .from('user_social_presence')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (socialPresence) {
        setSocialPresenceData(socialPresence);
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (section: string, data: any) => {
    if (!user) return;

    try {
      switch (section) {
        case 'profile':
          await supabase
            .from('profiles')
            .upsert({ 
              user_id: user.id, 
              ...data,
              updated_at: new Date().toISOString()
            });
          setProfileData(prev => ({ ...prev, ...data }));
          break;

        case 'devices':
          await supabase
            .from('user_devices')
            .upsert({ 
              user_id: user.id, 
              ...data,
              updated_at: new Date().toISOString()
            });
          setDeviceData(prev => ({ ...prev, ...data }));
          break;

        case 'tech_fluency':
          await supabase
            .from('user_tech_fluency')
            .upsert({ 
              user_id: user.id, 
              ...data,
              updated_at: new Date().toISOString()
            });
          setTechFluencyData(prev => ({ ...prev, ...data }));
          break;

        case 'skills':
          await supabase
            .from('user_skills')
            .upsert({ 
              user_id: user.id, 
              ...data,
              updated_at: new Date().toISOString()
            });
          setSkillsData(prev => ({ ...prev, ...data }));
          break;

        case 'social_presence':
          await supabase
            .from('user_social_presence')
            .upsert({ 
              user_id: user.id, 
              ...data,
              updated_at: new Date().toISOString()
            });
          setSocialPresenceData(prev => ({ ...prev, ...data }));
          break;
      }

      // Recalculate completion percentage
      await calculateCompletion();
    } catch (error) {
      console.error('Error updating profile data:', error);
      throw error;
    }
  };

  const calculateCompletion = async () => {
    if (!user) return;

    try {
      const { data } = await supabase.rpc('calculate_profile_completion', {
        profile_user_id: user.id
      });

      if (data !== null) {
        // Update the completion percentage in the profiles table
        await supabase
          .from('profiles')
          .update({ completion_percentage: data })
          .eq('user_id', user.id);

        setProfileData(prev => ({ ...prev, completion_percentage: data }));
      }
    } catch (error) {
      console.error('Error calculating completion:', error);
    }
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
    isProfileComplete,
    updateProfileData,
    setCurrentStep,
    calculateCompletion,
    uploadProfilePicture
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};