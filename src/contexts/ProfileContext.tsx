import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useOptimizedErrorHandler } from '@/hooks/useOptimizedErrorHandler';
import { handleError } from '@/utils/unifiedErrorHandling';
import { calculateProfileCompletionPercentage } from '@/utils/profileCompletionUtils';
import { cachedProfileDataLoader, batchedProfileUpdater, optimizedCompletionCalculator, preloadProfileDependencies } from '@/services/optimizedProfileServices';
import { profilePictureUploader } from '@/services/profilePictureUploader';
import { profileCompletionTracker } from '@/services/profileCompletionTracker';
import { useMemo } from 'react';
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
  const { handleError: handleErrorWithToast } = useOptimizedErrorHandler();

  // State management
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [techFluencyData, setTechFluencyData] = useState<TechFluencyData>({});
  const [skillsData, setSkillsData] = useState<SkillsData>({});
  const [socialPresenceData, setSocialPresenceData] = useState<SocialPresenceData>({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Memoized profile completion check
  const isProfileComplete = useMemo(() => {
    const completionPercentage = profileData.completion_percentage || 0;
    const profileCompleted = profileData.profile_completed || false;
    
    return profileCompleted || completionPercentage >= 100;
  }, [profileData.completion_percentage, profileData.profile_completed]);

  // Memoized completion calculation using optimized calculator
  const calculateCompletion = useCallback(() => {
    return optimizedCompletionCalculator(profileData, deviceData, techFluencyData, skillsData);
  }, [profileData, deviceData, techFluencyData, skillsData]);

  const resumeIncompleteSection = useCallback(() => {
    if (!user) return;
    
    profileCompletionTracker.resumeIncompleteSection(profileData, setCurrentStep);
  }, [profileData, user]);

  // Load profile data when user changes - now using cached loader
  useEffect(() => {
    if (user) {
      loadProfileData();
      // Preload dependencies in background
      preloadProfileDependencies(user.id).catch(console.warn);
    } else {
      setLoading(false);
    }
  }, [user]);

  // Optimized completion calculation with debouncing
  useEffect(() => {
    if (user && !loading && !isUpdating) {
      const completion = calculateCompletion();
      
      // Only update if there's a meaningful change
      if (Math.abs(completion - (profileData.completion_percentage || 0)) > 5) {
        setProfileData(prev => ({ 
          ...prev, 
          completion_percentage: completion,
          profile_completed: completion >= 100
        }));
      }
    }
  }, [profileData, deviceData, techFluencyData, skillsData, calculateCompletion, user, loading, isUpdating]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Use cached profile data loader
      const profileDataResponse = await cachedProfileDataLoader.loadAll(user.id);
      
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
      
      // Use batched updater for better performance
      await batchedProfileUpdater.add({ section, data, userId: user.id });
      
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

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
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
  }), [
    profileData,
    deviceData,
    techFluencyData,
    skillsData,
    socialPresenceData,
    loading,
    currentStep,
    isProfileComplete,
    updateProfileData,
    calculateCompletion,
    uploadProfilePicture,
    resumeIncompleteSection
  ]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
