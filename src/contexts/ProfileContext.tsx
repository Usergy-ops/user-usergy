import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

type UserDevices = Database['public']['Tables']['user_devices']['Row'];
type UserTechFluency = Database['public']['Tables']['user_tech_fluency']['Row'];
type UserSkills = Database['public']['Tables']['user_skills']['Row'];
type UserSocialPresence = Database['public']['Tables']['user_social_presence']['Row'];

interface ProfileData extends Partial<Profile> {}
interface DeviceData extends Partial<UserDevices> {}
interface TechFluencyData extends Partial<UserTechFluency> {}
interface SkillsData extends Partial<UserSkills> {}
interface SocialPresenceData extends Partial<UserSocialPresence> {}

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
  calculateCompletion: () => number;
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

  // Calculate completion percentage based on mandatory fields
  const calculateCompletion = useCallback(() => {
    const mandatoryFields = {
      // Basic Profile (7 fields)
      full_name: profileData.full_name,
      avatar_url: profileData.avatar_url,
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
      ai_tools_used: techFluencyData.ai_models_used,
      ai_interests: techFluencyData.ai_interests,
    };

    const totalFields = Object.keys(mandatoryFields).length;
    const completedFields = Object.values(mandatoryFields).filter(value => {
      if (Array.isArray(value)) {
        return value && value.length > 0;
      }
      return value && value.toString().trim() !== '';
    }).length;

    const percentage = Math.round((completedFields / totalFields) * 100);
    
    // Update completion percentage in state and database
    if (user && percentage !== profileData.completion_percentage) {
      setProfileData(prev => ({ ...prev, completion_percentage: percentage }));
      supabase
        .from('profiles')
        .update({ completion_percentage: percentage } as ProfileUpdate)
        .eq('user_id', user.id)
        .then(() => {
          console.log('Completion percentage updated:', percentage);
        });
    }
    
    return percentage;
  }, [profileData, deviceData, techFluencyData, user]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Recalculate completion whenever data changes
  useEffect(() => {
    if (user && !loading) {
      calculateCompletion();
    }
  }, [profileData, deviceData, techFluencyData, calculateCompletion, user, loading]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load all data in parallel
      const [profileResult, devicesResult, techResult, skillsResult, socialResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_devices').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_tech_fluency').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_skills').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_social_presence').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      if (profileResult.data) {
        setProfileData(profileResult.data);
      }

      if (devicesResult.data) {
        setDeviceData(devicesResult.data);
      }

      if (techResult.data) {
        setTechFluencyData(techResult.data);
      }

      if (skillsResult.data) {
        setSkillsData(skillsResult.data);
      }

      if (socialResult.data) {
        setSocialPresenceData(socialResult.data);
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
          const { completion_percentage, ...profileDataToSave } = data;
          const profileUpdate: ProfileUpdate = profileDataToSave;
          
          await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('user_id', user.id);
          setProfileData(prev => ({ ...prev, ...data }));
          break;

        case 'devices':
          await supabase
            .from('user_devices')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          setDeviceData(prev => ({ ...prev, ...data }));
          break;

        case 'tech_fluency':
          await supabase
            .from('user_tech_fluency')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          setTechFluencyData(prev => ({ ...prev, ...data }));
          break;

        case 'skills':
          await supabase
            .from('user_skills')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          setSkillsData(prev => ({ ...prev, ...data }));
          break;

        case 'social_presence':
          await supabase
            .from('user_social_presence')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          setSocialPresenceData(prev => ({ ...prev, ...data }));
          break;
      }
    } catch (error) {
      console.error('Error updating profile data:', error);
      throw error;
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