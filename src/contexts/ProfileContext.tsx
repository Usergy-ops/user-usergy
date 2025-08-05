import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { handleError } from '@/utils/unifiedErrorHandling';
import { calculateProfileCompletionPercentage } from '@/utils/profileCompletionUtils';
import { profileDataLoader } from '@/services/profileDataLoader';
import { profileDataUpdater } from '@/services/profileUpdater';
import { profilePictureUploader } from '@/services/profilePictureUploader';
import { profileCompletionTracker } from '@/services/profileCompletionTracker';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserDevices = Database['public']['Tables']['user_devices']['Row'];
type UserTechFluency = Database['public']['Tables']['user_tech_fluency']['Row'];
type UserSkills = Database['public']['Tables']['user_skills']['Row'];
type ConsolidatedSocialPresence = Database['public']['Tables']['consolidated_social_presence']['Row'];

interface ProfileData extends Partial<Profile> {}
interface DeviceData extends Partial<UserDevices> {}
interface TechFluencyData extends Partial<UserTechFluency> {}
interface SkillsData extends Partial<UserSkills> {}
interface SocialPresenceData extends Partial<ConsolidatedSocialPresence> {}

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
  resumeIncompleteSection: () => void;
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
  const { handleError: handleErrorWithToast } = useErrorHandler();

  // State management
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [techFluencyData, setTechFluencyData] = useState<TechFluencyData>({});
  const [skillsData, setSkillsData] = useState<SkillsData>({});
  const [socialPresenceData, setSocialPresenceData] = useState<SocialPresenceData>({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Enhanced profile completion check with better race condition handling
  const isProfileComplete = React.useMemo(() => {
    const completionPercentage = profileData.completion_percentage || 0;
    const profileCompleted = profileData.profile_completed || false;
    
    return profileCompleted || completionPercentage >= 100;
  }, [profileData.completion_percentage, profileData.profile_completed]);

  console.log('ProfileProvider state:', {
    profileData: {
      completion_percentage: profileData.completion_percentage,
      profile_completed: profileData.profile_completed,
      section_4_completed: profileData.section_4_completed,
      technical_experience_level: profileData.technical_experience_level,
      ai_familiarity_level: profileData.ai_familiarity_level
    },
    isProfileComplete,
    loading,
    isUpdating
  });

  const resumeIncompleteSection = useCallback(() => {
    if (!user) return;
    
    profileCompletionTracker.resumeIncompleteSection(profileData, setCurrentStep);
  }, [profileData, user]);

  const calculateCompletion = useCallback(() => {
    const completionData = {
      profileData,
      deviceData,
      techFluencyData,
      skillsData
    };

    return profileCompletionTracker.calculateAndUpdateCompletion(
      completionData,
      user,
      isUpdating,
      setProfileData
    );
  }, [profileData, deviceData, techFluencyData, skillsData, user, isUpdating]);

  // Load profile data when user changes
  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Recalculate completion whenever data changes
  useEffect(() => {
    if (user && !loading && !isUpdating) {
      calculateCompletion();
    }
  }, [profileData, deviceData, techFluencyData, skillsData, calculateCompletion, user, loading, isUpdating]);

  // Resume incomplete section when profile data is loaded
  useEffect(() => {
    if (user && !loading && !isProfileComplete) {
      resumeIncompleteSection();
    }
  }, [user, loading, isProfileComplete, resumeIncompleteSection]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const profileDataResponse = await profileDataLoader.loadAll(user.id);
      
      setProfileData(profileDataResponse.profile || {});
      setDeviceData(profileDataResponse.devices || {});
      setTechFluencyData(profileDataResponse.techFluency || {});
      setSkillsData(profileDataResponse.skills || {});
      setSocialPresenceData(profileDataResponse.socialPresence || {});
      
    } catch (error) {
      console.error('Error loading profile data:', error);
      await handleError(error as Error, 'profile_load', user.id);
      handleErrorWithToast(error, 'ProfileContext.loadProfileData');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (section: string, data: any) => {
    if (!user || isUpdating) return;

    try {
      setIsUpdating(true);
      
      await profileDataUpdater.updateSection(section, data, user.id);
      
      // Update local state based on section
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

    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      await handleError(error as Error, `profile_update_${section}`, user.id);
      handleErrorWithToast(error, `ProfileContext.updateProfileData.${section}`);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const publicUrl = await profilePictureUploader.upload(file, user.id);
      return publicUrl;
    } catch (error) {
      await handleError(error as Error, 'profile_picture_upload', user.id);
      handleErrorWithToast(error, 'ProfileContext.uploadProfilePicture');
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
    isProfileComplete,
    updateProfileData,
    setCurrentStep,
    calculateCompletion,
    uploadProfilePicture,
    resumeIncompleteSection
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
